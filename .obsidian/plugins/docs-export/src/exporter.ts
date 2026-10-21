import { App, TFile } from 'obsidian';
import * as fs from 'node:fs/promises';
import * as nodePath from 'node:path';
import { DocsExportSettings } from './settings';
import { allMarkdownFiles, isFileIncluded } from './selection';
import { renderMarkdown, RenderResult, type RenderCtx } from './render';
import { pageHtml, graphHtml, landingHtml, renderToc, type TreeFolder } from './site';
import clientBundle from './generated/client-bundle';
import themeCss from './generated/theme-css';

export interface ExportSummary {
	dest: string;
	pages: number;
	attachments: number;
}

export interface ExportHooks {
	onFileDone?: (done: number, total: number, current: string) => void;
	shouldAbort?: () => boolean;
}

// ---------------------------------------------------------------------------

export function slugifyPathSegment(seg: string): string {
	let s = seg.trim().toLowerCase();
	s = s.replace(/[^\p{L}\p{N}\s._-]/gu, '');
	s = s.replace(/\s+/g, '-').replace(/-+/g, '-');
	s = s.replace(/^\.+/, '');
	return s === '.' || s === '..' ? '' : s;
}

export function posixDir(filePath: string): string {
	const i = filePath.lastIndexOf('/');
	return i < 0 ? '' : filePath.slice(0, i);
}

/** note name (index/home) that owns the folder's index.html */
function isIndexNote(name: string): boolean {
	const n = name.toLowerCase();
	return n === 'index' || n === 'home';
}

interface PageInfo { file: TFile; url: string; dir: string; base: string }

export async function exportSite(
	app: App,
	settings: DocsExportSettings,
	destFolder: string,
	hooks: ExportHooks = {},
): Promise<ExportSummary> {
	const dest = nodePath.resolve(destFolder);
	await fs.mkdir(dest, { recursive: true });

	// ---- selection ----
	const files = allMarkdownFiles(app).filter((f) => isFileIncluded(settings, f));
	if (files.length === 0) {
		throw new Error('No notes selected for export. Pick folders/files in the plugin settings first.');
	}

	// ---- url map (folders may nest; slugs must be unique per folder) ----
	const pages: PageInfo[] = [];
	const pageByUrl = new Map<string, PageInfo>();
	const pageByPath = new Map<string, PageInfo>();
	const dirSlugUsed = new Map<string, Map<string, number>>();
	for (const file of files) {
		const dir = posixDir(file.path);
		const base = isIndexNote(file.basename) ? 'index' : uniqueFileSlug(dir, file.basename, dirSlugUsed);
		const url =
			(dir ? dir.split('/').map((s) => slugifyPathSegment(s)).filter(Boolean).join('/') + '/' : '') +
			(base + '.html');
		const info: PageInfo = { file, url, dir, base: file.basename };
		pages.push(info);
		pageByPath.set(file.path, info);
		if (!pageByUrl.has(url)) pageByUrl.set(url, info);
	}
	const exportedPaths = new Set(pageByPath.keys());
	const urlFor = (file: TFile) => pageByPath.get(file.path)?.url ?? '';

	// ---- rendering ----
	const results = new Map<string, RenderResult>();
	const pendingCopies = new Set<TFile>();
	const inProgress = new Set<string>();

	const copyAsset = (file: TFile): string => {
		pendingCopies.add(file);
		return 'oasset://' + encodeURIComponent(file.path);
	};
	const resolveDest = (linkpath: string, sourcePath: string): TFile | null =>
		app.metadataCache.getFirstLinkpathDest(linkpath, sourcePath);

	const childRender = async (file: TFile, depth: number): Promise<{ html: string; title: string } | null> => {
		const existing = results.get(file.path);
		if (existing) return { html: existing.html, title: existing.title };
		if (depth > 3) return null; // hard nesting limit
		if (inProgress.has(file.path)) return null; // embed cycle
		inProgress.add(file.path);
		try {
			const r = await renderFile(file);
			return { html: r.html, title: r.title };
		} finally {
			inProgress.delete(file.path);
		}
	};

	async function renderFile(file: TFile): Promise<RenderResult> {
		const cached = results.get(file.path);
		if (cached) return cached;
		const content = await app.vault.cachedRead(file);
		const ctx: RenderCtx = {
			app,
			resolveDest,
			copyAsset,
			isExported: (f) => exportedPaths.has(f.path),
			urlFor,
			child: childRender,
		};
		const result = await renderMarkdown(ctx, file, content, 0);
		results.set(file.path, result);
		return result;
	}

	for (let i = 0; i < pages.length; i++) {
		if (hooks.shouldAbort?.()) throw new Error('Export aborted');
		const info = pages[i];
		await renderFile(info.file);
		hooks.onFileDone?.(i + 1, pages.length, info.base);
	}

	// ---- sidebar tree (titles now known) ----
	const titleOf = (file: TFile): string => results.get(file.path)?.title ?? file.basename;
	const urlOf = (file: TFile): string => urlFor(file);
	const tree = buildTree(files, titleOf, urlOf);
	markOpenFolders(tree, pages.map((p) => posixDir(p.url)));
	const orderedUrls = flattenTreeOrder(tree);

	// ---- assets ----
	await fs.mkdir(nodePath.join(dest, 'assets'), { recursive: true });
	await fs.writeFile(nodePath.join(dest, 'assets', 'style.css'), themeCss, 'utf8');
	await fs.writeFile(nodePath.join(dest, 'assets', 'site.js'), clientBundle, 'utf8');

	for (const file of pendingCopies) {
		const src = await app.vault.adapter.readBinary(file.path);
		const target = nodePath.join(dest, 'assets', ...file.path.split('/'));
		await fs.mkdir(nodePath.dirname(target), { recursive: true });
		await fs.writeFile(target, Buffer.from(src));
	}

	// ---- search index ----
	const searchPages = pages.map((p) => {
		const r = results.get(p.file.path)!;
		return {
			u: p.url,
			t: r.title,
			c: p.dir ? p.dir.split('/').join(' › ') : 'Root',
			h: r.headings.filter((h) => h.level >= 2).slice(0, 60).map((h) => h.text),
			b: htmlToText(r.html).slice(0, 40000),
		};
	});
	await fs.writeFile(
		nodePath.join(dest, 'assets', 'search.json'),
		JSON.stringify({ pages: searchPages }),
		'utf8',
	);

	// ---- graph data ----
	const nodeIdx = new Map<string, number>();
	const graphNodes = pages.map((p, i) => {
		nodeIdx.set(p.url, i);
		return { id: p.url, label: results.get(p.file.path)?.title ?? p.file.basename };
	});
	const seenEdges = new Set<string>();
	const graphLinks: { s: string; t: string }[] = [];
	for (const p of pages) {
		const r = results.get(p.file.path)!;
		for (const target of r.outgoing) {
			const info = pageByPath.get(target.path);
			if (!info || info.url === p.url) continue;
			const key = `${info.url}->${p.url}`; // treat links as undirected
			if (seenEdges.has(key)) continue;
			seenEdges.add(key);
			graphLinks.push({ s: p.url, t: info.url });
		}
	}
	await fs.writeFile(
		nodePath.join(dest, 'assets', 'graph.json'),
		JSON.stringify({ nodes: graphNodes, links: graphLinks }),
		'utf8',
	);

	// ---- write note pages ----
	const version = Date.now().toString(36);
	for (const p of pages) {
		const r = results.get(p.file.path)!;
		const root = relRoot(p.url);
		const stat = await app.vault.adapter.stat(p.file.path);
		const idxInOrder = orderedUrls.indexOf(p.url);
		const data = {
			siteName: settings.siteName,
			version,
			title: r.title,
			url: p.url,
			root,
			content: rewriteAssetUrls(r.html, root),
			tree,
			headings: r.headings,
			tags: Array.from(new Set(r.tags)),
			crumbs: crumbsList(p, pageByUrl),
			lastUpdated:
				settings.showLastUpdated && stat
					? new Date(stat.mtime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
					: null,
			showBreadcrumbs: settings.showBreadcrumbs,
			showLastUpdated: settings.showLastUpdated,
			showPagination: settings.showPagination,
			prev:
				settings.showPagination && idxInOrder > 0
					? { title: titleByUrl(orderedUrls[idxInOrder - 1], pageByUrl, titleOf), url: orderedUrls[idxInOrder - 1] }
					: null,
			next:
				settings.showPagination && idxInOrder >= 0 && idxInOrder < orderedUrls.length - 1
					? { title: titleByUrl(orderedUrls[idxInOrder + 1], pageByUrl, titleOf), url: orderedUrls[idxInOrder + 1] }
					: null,
			showToc: !!renderToc(r.headings),
			usesMermaid: r.usesMermaid,
			mermaidCdn: settings.enableMermaid,
		};
		const out = nodePath.join(dest, ...p.url.split('/'));
		await fs.mkdir(nodePath.dirname(out), { recursive: true });
		await fs.writeFile(out, pageHtml(data), 'utf8');
	}

	// ---- graph page ----
	await fs.writeFile(
		nodePath.join(dest, 'graph.html'),
		graphHtml({ siteName: settings.siteName, version, root: '', tree }),
		'utf8',
	);

	// ---- landing page when there is no root index note ----
	if (!pageByUrl.has('index.html') && tree.children.length > 0) {
		const sections = tree.children
			.filter((c): c is TreeFolder => c.type === 'folder')
			.map((folder) => ({
				name: folder.name,
				url: firstIndexUrl(folder) ?? firstFileUrl(folder) ?? '',
				count: countFlat(folder),
			}))
			.filter((s) => s.url);
		await fs.writeFile(
			nodePath.join(dest, 'index.html'),
			landingHtml({ siteName: settings.siteName, version, root: '', tree, sections }),
			'utf8',
		);
	}

	return { dest, pages: pages.length + 1, attachments: pendingCopies.size };
}

// ---------------------------------------------------------------------------

function uniqueFileSlug(dir: string, base: string, usedByDir: Map<string, Map<string, number>>): string {
	let slug = slugifyPathSegment(base);
	slug = slug || base.replace(/[^\w-]+/g, '-');
	let used = usedByDir.get(dir);
	if (!used) {
		used = new Map();
		usedByDir.set(dir, used);
	}
	const n = used.get(slug) ?? 0;
	used.set(slug, n + 1);
	return n > 0 ? `${slug}-${n}` : slug;
}

/** relative prefix ("../") from a page to the site root */
export function relRoot(url: string): string {
	const dir = posixDir(url);
	if (!dir) return '';
	return dir.split('/').map(() => '..').join('/') + '/';
}

/** turn oasset:// and oroot:// tokens (attribute positions only) into page-relative URLs */
export function rewriteAssetUrls(html: string, root: string): string {
	return html
		.replace(
			/(src|href)="oasset:\/\/([^"]+)"/g,
			(_m, attr: string, enc: string) => {
				const path = safeDecode(enc);
				const encoded = path.split('/').map(encodeURIComponent).join('/');
				return `${attr}="${root}assets/${encoded}"`;
			},
		)
		.replace(
			/(src|href)="oroot:\/\/([^"]+)"/g,
			(_m, attr: string, enc: string) => `${attr}="${root}${safeDecode(enc)}"`,
		);
}

function safeDecode(s: string): string {
	try {
		return decodeURIComponent(s);
	} catch {
		return s;
	}
}

function htmlToText(html: string): string {
	return html
		.replace(/<style[\s\S]*?<\/style>/g, ' ')
		.replace(/<script[\s\S]*?<\/script>/g, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

function buildTree(
	files: TFile[],
	titleOf: (f: TFile) => string,
	urlOf: (f: TFile) => string,
): TreeFolder {
	const root: TreeFolder = { type: 'folder', name: '', children: [] };
	for (const file of files) {
		const segs = file.path.split('/');
		let cursor = root;
		for (let i = 0; i < segs.length - 1; i++) {
			let next = cursor.children.find(
				(c): c is TreeFolder => c.type === 'folder' && c.name === segs[i],
			);
			if (!next) {
				next = { type: 'folder', name: segs[i], children: [] };
				cursor.children.push(next);
			}
			cursor = next;
		}
		cursor.children.push({
			type: 'file',
			name: segs[segs.length - 1],
			title: titleOf(file),
			url: urlOf(file),
		});
	}
	sortTree(root);
	return root;
}

function sortTree(node: TreeFolder): void {
	node.children.sort((a, b) => {
		if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
		return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
	});
	node.children.forEach((c) => {
		if (c.type === 'folder') sortTree(c);
	});
}

function markOpenFolders(root: TreeFolder, pageDirs: string[]): void {
	const ancestors = new Set<string>();
	for (const dir of pageDirs) {
		if (!dir) continue;
		const segs = dir.split('/');
		for (let i = 1; i <= segs.length; i++) ancestors.add(segs.slice(0, i).join('/'));
	}
	const walk = (folder: TreeFolder, prefix: string) => {
		for (const child of folder.children) {
			if (child.type !== 'folder') continue;
			const path = prefix ? `${prefix}/${child.name}` : child.name;
			if (ancestors.has(path)) {
				child.open = true;
				walk(child, path);
			}
		}
	};
	walk(root, '');
}

/** depth-first file url order (folders first, alphabetical) */
function flattenTreeOrder(root: TreeFolder): string[] {
	const out: string[] = [];
	const walk = (folder: TreeFolder) => {
		for (const child of folder.children) {
			if (child.type === 'folder') walk(child);
			else out.push(child.url);
		}
	};
	walk(root);
	return out;
}

function crumbsList(p: PageInfo, pageByUrl: Map<string, PageInfo>): { name: string; url?: string }[] {
	if (!p.dir) return [];
	const crumbs: { name: string; url?: string }[] = [];
	const segs = p.dir.split('/');
	for (let i = 0; i < segs.length; i++) {
		const partial = segs.slice(0, i + 1).join('/');
		const indexPage = pageByUrl.get(partial + '/index.html');
		const isLast = i === segs.length - 1;
		crumbs.push({ name: segs[i], url: isLast || !indexPage ? undefined : partial + '/index.html' });
	}
	return crumbs;
}

function titleByUrl(url: string, pageByUrl: Map<string, PageInfo>, titleOf: (f: TFile) => string): string {
	const info = pageByUrl.get(url);
	return info ? titleOf(info.file) : url.replace(/\.html$/, '');
}

function firstIndexUrl(folder: TreeFolder): string | null {
	for (const c of folder.children) {
		if (c.type === 'file' && isIndexNote(c.name.replace(/\.md$/i, ''))) return c.url;
	}
	return null;
}

function firstFileUrl(folder: TreeFolder): string | null {
	for (const c of folder.children) {
		if (c.type === 'file') return c.url;
		const sub = firstFileUrl(c as TreeFolder);
		if (sub) return sub;
	}
	return null;
}

function countFlat(folder: TreeFolder): number {
	let n = 0;
	for (const c of folder.children) {
		if (c.type === 'file') n++;
		else n += countFlat(c);
	}
	return n;
}
