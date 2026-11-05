import { App, TFile, normalizePath } from 'obsidian';

/** Vault-relative default location of the user rules note injected per turn. */
export const DEFAULT_RULES_NOTE_PATH = 'CompAInion Rules.md';
/** Character budget of the rules note injected into the system prompt. */
export const MAX_RULES_CHARS = 8000;

export interface RulesContent {
	path: string;
	text: string;
	truncated: boolean;
}

export const DEFAULT_RULES_CONTENT = [
	'# CompAInion Rules',
	'',
	'Standing instructions for the CompAInion AI copilot. They are loaded into the assistant\'s instructions on every message.',
	'Edit this note freely - changes apply from your next message. Remove rules you do not want and add your own under any heading.',
	'If this note is missing, CompAInion recreates it with these defaults the next time the plugin loads.',
	'',
	'## Quizzes and self-testing',
	'',
	'When asked to build a quiz from your notes, build a self-test, not an answer sheet:',
	'',
	'- The quiz must NOT contain any answers. The user fills in the answer fields themselves.',
	'- Number the questions (1., 2., ...). Quiz content must come from the notes you read, never from general knowledge.',
	'- Put every question in its own callout, exactly in this shape:',
	'',
	'> [!question] 1. Which template engine does Symfony use?',
	'> - [ ] A. Blade',
	'> - [ ] B. Twig',
	'> - [ ] C. Vue',
	'> - [ ] D. Mustache',
	'>',
	'> Answer:',
	'> ```',
	'>',
	'> ```',
	'',
	'- Multiple choice: exactly four checkbox options (A-D) inside the same callout.',
	'- True/False: `- [ ] True` and `- [ ] False` checkboxes inside the callout.',
	'- Identification (short answer): no options; the numbered question plus the empty answer field only.',
	'- Leave every answer field empty. Never write the correct answer into the field, the callout, or the note.',
	'- Only when the user explicitly asks to show, grade, or check answers: read the note first, then reply with the answer key in the chat. Add an `## Answer key` section at the bottom of the note only when the user asks to put it there.',
	'',
	'## General',
	'',
	'- Put new quiz and study notes into the same folder as their source notes unless told otherwise.',
	'- Keep answers factual and sourced from the vault notes you read.',
].join('\n');

/** Clean up a user-configured rules path; fall back to the default when invalid. */
export function sanitizeRulesPath(rawPath: string): string {
	const trimmed = (rawPath ?? '').trim().replace(/\\/g, '/');
	if (!trimmed.length) {
		return DEFAULT_RULES_NOTE_PATH;
	}
	const candidate = normalizePath(
		trimmed
			.replace(/\/{2,}/g, '/')
			.replace(/^\.\//, '')
			.replace(/\/$/, ''),
	);
	const rejected = !candidate.length
		|| candidate === '.'
		|| candidate.startsWith('..')
		|| candidate.includes('/../')
		|| candidate.startsWith('.')
		|| candidate.includes('/.')
		|| !/^[^<>:"|?*\u0000-\u001f]+$/.test(candidate);
	if (rejected) {
		return DEFAULT_RULES_NOTE_PATH;
	}
	if (/\.md$/i.test(candidate)) {
		return candidate;
	}
	return `${candidate}.md`;
}

/** Create the rules note with the default content when it does not exist (never overwrites). */
export async function ensureRulesNote(app: App, configuredPath: string): Promise<{ path: string; created: boolean }> {
	const path = sanitizeRulesPath(configuredPath);
	const existing = app.vault.getAbstractFileByPath(path);
	if (existing instanceof TFile && existing.extension.toLowerCase() === 'md') {
		return { path, created: false };
	}
	const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
	if (dir.length) {
		const segments = dir.split('/');
		let current = '';
		for (const segment of segments) {
			current = current.length ? `${current}/${segment}` : segment;
			const node = app.vault.getAbstractFileByPath(current);
			if (!node) {
				try {
					await app.vault.createFolder(current);
				} catch {
					// Race with another creator; the create() below reports real failures.
				}
			}
		}
	}
	await app.vault.create(path, DEFAULT_RULES_CONTENT);
	return { path, created: true };
}

/** Read the rules note contents for prompt injection; null when the note is missing or empty. */
export async function readRulesNote(app: App, configuredPath: string): Promise<RulesContent | null> {
	const path = sanitizeRulesPath(configuredPath);
	const node = app.vault.getAbstractFileByPath(path);
	if (!(node instanceof TFile) || node.extension.toLowerCase() !== 'md') {
		return null;
	}
	try {
		const raw = await app.vault.read(node);
		const text = raw.trim();
		if (!text.length) {
			return null;
		}
		if (text.length > MAX_RULES_CHARS) {
			return {
				path,
				text: `${text.slice(0, MAX_RULES_CHARS)}\n[... rules note truncated at ${MAX_RULES_CHARS} characters ...]`,
				truncated: true,
			};
		}
		return { path, text, truncated: false };
	} catch {
		return null;
	}
}
