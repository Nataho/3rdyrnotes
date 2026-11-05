import { App, TFile, TFolder, normalizePath } from 'obsidian';
import { OperationResult, VaultAction, VaultOperation } from './types';

const MAX_PATH_LENGTH = 256;
const MAX_SEGMENT_LENGTH = 255;
/** Default number of matched paths returned by one search operation. */
export const SEARCH_RESULT_LIMIT = 10;
/** Notes scanned for the content fallback pass when no path matches. */
const MAX_CONTENT_SCAN_FILES = 500;
/** Character budget of the compact vault outline appended to the system prompt. */
const MAX_OUTLINE_CHARS = 1200;
/** Character budget of the per-note index block; bigger vaults fall back to the folder outline. */
const INDEX_CHARS_BUDGET = 4000;
const FORBIDDEN_WINDOWS_NAMES = new Set([
	'con', 'prn', 'aux', 'nul',
	'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
	'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
]);

export interface PathValidation {
	ok: boolean;
	/** Normalized, vault-relative path when ok. */
	path: string;
	/** Human readable rejection reason when not ok. */
	error?: string;
}

/** Executes every actual vault touch. Never throws for expected failures; returns OperationResults. */
export class VaultManager {
	private readonly app: App;

	constructor(app: App) {
		this.app = app;
	}

	/** Validate and normalize an AI-provided vault path. */
	validatePath(rawPath: string): PathValidation {
		const rejected = (error: string): PathValidation => ({ ok: false, path: '', error });

		if (typeof rawPath !== 'string') {
			return rejected('Operation path is missing.');
		}
		let path = rawPath.trim();
		if (!path.length) {
			return rejected('Operation path is empty.');
		}
		if (/[\u0000-\u001f\u007f]/.test(path)) {
			return rejected('Operation path contains control characters.');
		}
		if (path.length > MAX_PATH_LENGTH) {
			return rejected(`Operation path is longer than ${MAX_PATH_LENGTH} characters.`);
		}
		if (/^[A-Za-z]:[\\/]/.test(path) || path.startsWith('\\\\') || path.startsWith('//')) {
			return rejected('Absolute paths and network shares are not allowed; use a path relative to the vault.');
		}
		// Normalize separators and decoration.
		path = normalizePath(path.replace(/\\/g, '/').trim());
		path = path
			.replace(/\/{2,}/g, '/')
			.replace(/^\.\//, '')
			.replace(/\/$/, '');
		if (!path.length || path === '.' || path.startsWith('/')) {
			return rejected('Operation path is empty or points to the vault root.');
		}
		const segments = path.split('/');
		for (const segment of segments) {
			if (!segment.length) {
				return rejected('Malformed operation path.');
			}
			if (segment === '.' || segment === '..') {
				return rejected('Directory traversal (".." or ".") is not allowed; the path must stay inside the vault.');
			}
			if (segment.startsWith('.')) {
				return rejected('Access to hidden or system folders (e.g. .obsidian, .trash) is not allowed.');
			}
			if (segment.length > MAX_SEGMENT_LENGTH) {
				return rejected('A path segment exceeds the maximum name length.');
			}
			if (/[<>:"|?*]/.test(segment) || segment.endsWith(' ') || segment.endsWith('.')) {
				return rejected('The path contains characters that are not valid in file names.');
			}
			if (FORBIDDEN_WINDOWS_NAMES.has(segment.toLowerCase())) {
				return rejected('The path uses a reserved system file name.');
			}
		}
		if (!/\.md$/i.test(path)) {
			return rejected('Only Markdown notes (.md) are managed by this assistant.');
		}
		return { ok: true, path };
	}

	/** Resolve a validated path to a TFile, or null when the file does not exist. */
	getFile(path: string): TFile | null {
		const node = this.app.vault.getAbstractFileByPath(path);
		return node instanceof TFile ? node : null;
	}

	/** Validate a path and resolve an existing TFile in one step. */
	private resolveExisting(action: VaultAction, path: string): { file?: TFile; error?: string } {
		const validation = this.validatePath(path);
		if (!validation.ok) {
			return { error: `${action}: ${validation.error}` };
		}
		const file = this.getFile(validation.path);
		if (!file) {
			return { error: `${action}: no note exists at "${validation.path}".` };
		}
		// Even when hidden check passed, be defensive about non-Markdown files.
		if (file.extension.toLowerCase() !== 'md') {
			return { error: `${action}: "${validation.path}" is not a Markdown note.` };
		}
		return { file };
	}

	/** Create missing parent folders for a file path. Returns created folder paths. */
	async ensureFolder(filePath: string): Promise<string[]> {
		const dir = filePath.includes('/') ? filePath.slice(0, filePath.lastIndexOf('/')) : '';
		if (!dir.length) {
			return [];
		}
		const created: string[] = [];
		const segments = dir.split('/');
		let current = '';
		for (const segment of segments) {
			current = current.length ? `${current}/${segment}` : segment;
			const existing = this.app.vault.getAbstractFileByPath(current);
			if (existing instanceof TFolder) {
				continue;
			}
			if (existing) {
				throw new Error(`"${current}" already exists as a file, a folder with that name cannot be created.`);
			}
			await this.app.vault.createFolder(current);
			created.push(current);
		}
		return created;
	}

	/**
	 * Execute a single operation immediately. Used by create/update/read flows
	 * and by confirmed deletes from the chat interface.
	 */
	async executeOperation(op: VaultOperation): Promise<OperationResult> {
		const action = op.action;
		switch (action) {
			case 'create':
				return this.create(op);
			case 'update':
				return this.update(op);
			case 'delete':
				return this.delete(op);
			case 'read':
				return this.read(op);
			case 'search':
				return this.search(op);
			default:
				return {
					ok: false,
					action: action,
					path: op.path,
					message: `Unsupported operation "${String(action as never)}".`,
				};
		}
	}

	private async create(op: VaultOperation): Promise<OperationResult> {
		const validation = this.validatePath(op.path);
		if (!validation.ok) {
			return { ok: false, action: 'create', path: op.path, message: `Create rejected: ${validation.error}` };
		}
		const path = validation.path;
		if (this.getFile(path)) {
			return { ok: false, action: 'create', path, message: `Create rejected: "${path}" already exists.` };
		}
		const content = typeof op.content === 'string' ? op.content : '';
		const steps: string[] = [];
		try {
			const folders = await this.ensureFolder(path);
			steps.push(...folders.map((folder) => `Created folder "${folder}"`));
			const file = await this.app.vault.create(path, content);
			steps.push(`Wrote ${content.length} characters`);
			return { ok: true, action: 'create', path: file.path, message: `Created note "${file.path}"`, steps };
		} catch (error) {
			const cause = error instanceof Error ? error.message : String(error);
			return { ok: false, action: 'create', path, message: `Create failed for "${path}"`, error: cause };
		}
	}

	private async update(op: VaultOperation): Promise<OperationResult> {
		const validation = this.validatePath(op.path);
		if (!validation.ok) {
			return { ok: false, action: 'update', path: op.path, message: `Update rejected: ${validation.error}` };
		}
		const path = validation.path;
		const resolved = this.resolveExisting('update', path);
		if (resolved.error || !resolved.file) {
			return { ok: false, action: 'update', path, message: resolved.error ?? 'Update failed.' };
		}
		if (typeof op.content !== 'string') {
			return { ok: false, action: 'update', path, message: `Update rejected: "${path}" has no new content.` };
		}
		try {
			await this.app.vault.modify(resolved.file, op.content);
			return {
				ok: true,
				action: 'update',
				path,
				message: `Updated note "${path}" (${op.content.length} characters now).`,
				steps: ['Previous content replaced as requested'],
			};
		} catch (error) {
			const cause = error instanceof Error ? error.message : String(error);
			return { ok: false, action: 'update', path, message: `Update failed for "${path}"`, error: cause };
		}
	}

	/** Delete is only ever called by the view after explicit user confirmation. */
	private async delete(op: VaultOperation): Promise<OperationResult> {
		const validation = this.validatePath(op.path);
		if (!validation.ok) {
			return { ok: false, action: 'delete', path: op.path, message: `Delete rejected: ${validation.error}` };
		}
		const path = validation.path;
		const resolved = this.resolveExisting('delete', path);
		if (resolved.error || !resolved.file) {
			return { ok: false, action: 'delete', path, message: resolved.error ?? 'Delete failed.' };
		}
		try {
			await this.app.vault.trash(resolved.file, false);
			return { ok: true, action: 'delete', path, message: `Moved "${path}" to the vault trash (.trash).`, steps: ['File kept in vault trash - never permanently deleted'] };
		} catch (error) {
			const cause = error instanceof Error ? error.message : String(error);
			return { ok: false, action: 'delete', path, message: `Delete failed for "${path}"`, error: cause };
		}
	}

	private async read(op: VaultOperation): Promise<OperationResult> {
		const validation = this.validatePath(op.path);
		if (!validation.ok) {
			return { ok: false, action: 'read', path: op.path, message: `Read rejected: ${validation.error}` };
		}
		const path = validation.path;
		const resolved = this.resolveExisting('read', path);
		if (resolved.error || !resolved.file) {
			return { ok: false, action: 'read', path, message: resolved.error ?? 'Read failed.' };
		}
		try {
			const content = await this.app.vault.read(resolved.file);
			return { ok: true, action: 'read', path, message: `Read "${path}"`, content };
		} catch (error) {
			const cause = error instanceof Error ? error.message : String(error);
			return { ok: false, action: 'read', path, message: `Read failed for "${path}"`, error: cause };
		}
	}

	/** Find notes by topic or name fragment: path match first, content fallback second. */
	private async search(op: VaultOperation): Promise<OperationResult> {
		const query = (op.query ?? op.path ?? '').trim();
		if (!query.length) {
			return { ok: false, action: 'search', path: op.path, message: 'Search rejected: no query was provided.' };
		}
		const needle = query.toLowerCase();
		if (needle.length > 120) {
			return { ok: false, action: 'search', path: query.slice(0, 120), message: 'Search rejected: the query is longer than 120 characters.' };
		}
		const files = this.app.vault.getMarkdownFiles();
		const matched: string[] = [];
		const pathHits: string[] = [];
		for (const file of files) {
			if (file.path.toLowerCase().includes(needle)) {
				pathHits.push(file.path);
			}
		}
		let contentFallback = false;
		if (pathHits.length === 0) {
			contentFallback = true;
			const cap = Math.min(files.length, MAX_CONTENT_SCAN_FILES);
			for (let index = 0; index < cap; index += 1) {
				try {
					const content = await this.app.vault.cachedRead(files[index]);
					if (content.toLowerCase().includes(needle)) {
						pathHits.push(files[index].path);
					}
				} catch {
					// Skip unreadable files; search is best effort.
				}
			}
		}
		const total = pathHits.length;
		if (total === 0) {
			return {
				ok: true,
				action: 'search',
				path: query,
				matched: [],
				message: `No notes match "${query}".${contentFallback ? ' Note contents were searched as well.' : ''}`,
			};
		}
		if (total > SEARCH_RESULT_LIMIT) {
			matched.push(...pathHits.slice(0, SEARCH_RESULT_LIMIT));
		} else {
			matched.push(...pathHits);
		}
		const scope = contentFallback
			? 'note names did not match; note contents were searched'
			: 'searched note names and folder paths';
		const truncation = total > SEARCH_RESULT_LIMIT ? `; listing the first ${SEARCH_RESULT_LIMIT}` : '';
		return {
			ok: true,
			action: 'search',
			path: query,
			matched,
			message: `Found ${total} note${total === 1 ? '' : 's'} matching "${query}" (${scope}${truncation}).`,
		};
	}

	/** Compact orientation of the vault: one line per folder with its note count. */
	vaultOutline(): string {
		const files = this.app.vault.getMarkdownFiles();
		if (files.length === 0) {
			return 'The vault currently contains no Markdown notes.';
		}
		const counts = new Map<string, number>();
		for (const file of files) {
			const folder = file.path.includes('/') ? file.path.slice(0, file.path.lastIndexOf('/')) : '(vault root)';
			counts.set(folder, (counts.get(folder) ?? 0) + 1);
		}
		const lines: string[] = [];
		let used = 0;
		for (const folder of [...counts.keys()].sort()) {
			const count = counts.get(folder) ?? 0;
			const line = `- ${folder}: ${count} note${count === 1 ? '' : 's'}`;
			if (used + line.length > MAX_OUTLINE_CHARS) {
				lines.push('- ... (outline truncated)');
				break;
			}
			lines.push(line);
			used += line.length + 1;
		}
		return ['Markdown folders in the vault (folder: note count):', ...lines].join('\n');
	}

	/**
	 * Always-current note index for the system prompt: every Markdown note path,
	 * grouped by folder. Computes fresh from the live vault on every request,
	 * so events never leave it stale. Falls back to the bare folder outline when
	 * even the bare names exceed the prompt budget.
	 */
	vaultIndexPrompt(maxChars: number = INDEX_CHARS_BUDGET): string {
		const files = this.app.vault.getMarkdownFiles();
		if (files.length === 0) {
			return 'The vault currently contains no Markdown notes.';
		}
		const byFolder = new Map<string, string[]>();
		let budget = 0;
		for (const file of files) {
			const folder = file.path.includes('/') ? file.path.slice(0, file.path.lastIndexOf('/')) : '(vault root)';
			const names = byFolder.get(folder) ?? [];
			names.push(file.name);
			byFolder.set(folder, names);
			budget += file.name.length + 2;
		}
		if (budget > maxChars) {
			return this.vaultOutline();
		}
		const lines: string[] = ['Note index - every Markdown note in the vault (folder grouping; a read operation uses the full path, e.g. "folder-name/File.md"):'];
		for (const folder of [...byFolder.keys()].sort()) {
			lines.push(`- ${folder}: ${(byFolder.get(folder) ?? []).join(', ')}`);
		}
		return lines.join('\n');
	}

	/**
	 * Execute a batch of operations coming straight from a validated AI response.
	 * create/update/read run immediately; delete operations are only validated here
	 * and returned separately so the view can ask the user for confirmation first.
	 */
	async executeOperations(ops: VaultOperation[]): Promise<{ results: OperationResult[]; pendingDeletes: VaultOperation[] }> {
		const results: OperationResult[] = [];
		const pendingDeletes: VaultOperation[] = [];
		for (const op of ops.slice(0, MAX_BATCH_OPERATIONS)) {
			if (op.action === 'delete') {
				const validation = this.validatePath(op.path);
				if (!validation.ok) {
					results.push({ ok: false, action: 'delete', path: op.path, message: `Delete rejected: ${validation.error}` });
					continue;
				}
				if (!this.getFile(validation.path)) {
					results.push({ ok: false, action: 'delete', path: op.path, message: `Delete rejected: no note exists at "${validation.path}".` });
					continue;
				}
				pendingDeletes.push({ ...op, path: validation.path });
				continue;
			}
			results.push(await this.executeOperation(op));
		}
		return { results, pendingDeletes };
	}
}

export const MAX_BATCH_OPERATIONS = 20;
