import { escapeHtml, type HeadingInfo } from './render';

export interface TreeFolder {
	type: 'folder';
	name: string;
	/** folders of the current page's ancestry start expanded */
	open?: boolean;
	children: TreeNode[];
}
export interface TreeFile {
	type: 'file';
	name: string;
	title: string;
	url: string;
	selected?: boolean;
}
export type TreeNode = TreeFolder | TreeFile;

export interface Breadcrumb {
	name: string;
	url?: string;
}

export interface PageData {
	siteName: string;
	/** per-export cache-buster stamped onto asset urls */
	version: string;
	title: string;
	/** site-root-relative URL of this page, e.g. "its-300/lesson-1.html" */
	url: string;
	/** relative prefix from this page to the site root ("", "../", "../../") */
	root: string;
	content: string;
	tree: TreeFolder | null;
	headings: HeadingInfo[];
	tags: string[];
	crumbs: Breadcrumb[];
	lastUpdated: string | null;
	showBreadcrumbs: boolean;
	showLastUpdated: boolean;
	showPagination: boolean;
	prev: { title: string; url: string } | null;
	next: { title: string; url: string } | null;
	showToc: boolean;
	usesMermaid: boolean;
	mermaidCdn: boolean;
}

const LOGO = '<svg class="logo" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>' as const;
const CHEVRON = '<svg class="tree-chevron" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
const HAMBURGER = '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>';
const SEARCH_ICON = '<svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';
const GRAPH_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5" cy="6" r="3"/><circle cx="19" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><path d="M12 15v-3"/><path d="M7.5 7.5 10 12l2 1"/><path d="M16.5 7.5 14 12l-2 1"/></svg>';

const FAVICON = 'data:image/svg+xml,' + encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#1b1b1d"/><path d="M7 6.5v11A1.5 1.5 0 0 0 8.5 19H18V5H8.5A1.5 1.5 0 0 0 7 6.5Z M10 9h5M10 12h5" fill="none" stroke="#25c2a3" stroke-width="1.8" stroke-linecap="round"/></svg>',
);

/** prefix `root` for site-relative urls on DOM attributes */
function withRoot(root: string, url: string): string { return root + url; }

function renderTree(files: TreeNode[], isActiveUrl: (url: string) => boolean, root: string): string {
	return `<ul>${renderTreeItems(files, isActiveUrl, root)}</ul>`;
}

function renderTreeItems(files: TreeNode[], isActiveUrl: (url: string) => boolean, root: string): string {
	return files.map((node) => {
		if (node.type === 'folder') {
			return `<li class="tree-folder"><button class="tree-link${node.open ? ' open' : ''}" type="button">${CHEVRON}<span>${escapeHtml(node.name)}</span></button>` +
				`<ul class="${node.open ? 'is-open' : ''}">${renderTreeItems(node.children, isActiveUrl, root)}</ul></li>`;
		}
		const active = isActiveUrl(node.url);
		return `<li class="tree-file"><a class="tree-link${active ? ' active current' : ''}" href="${root}${node.url}">${escapeHtml(node.title)}</a></li>`;
	}).join('');
}

/** Build a nested <ul> toc from a flat heading list. */
export function renderToc(headings: HeadingInfo[]): string {
	const Flat = headings.filter((h) => h.level >= 2);
	if (Flat.length === 0) return '';
	const firstLevel = Flat[0].level;
	const items = Flat.map((h) => ({
		level: Math.max(2, h.level - firstLevel + 2),
		text: h.text,
		slug: h.slug,
	}));

	interface OutlineNode { level: number; text: string; slug: string; children: OutlineNode[] }
	const root: OutlineNode = { level: 1, text: '', slug: '', children: [] };
	const stack: OutlineNode[] = [root];
	for (const it of items) {
		const node: OutlineNode = { ...it, children: [] };
		while (stack.length > 1 && stack[stack.length - 1].level >= it.level) stack.pop();
		stack[stack.length - 1].children.push(node);
		stack.push(node);
	}

	const emit = (nodes: OutlineNode[]): string =>
		nodes
			.map((n) => {
				const kids = emit(n.children);
				return (
					`<li><a href="#${n.slug}">${escapeHtml(n.text)}</a>` +
					(kids ? `<ul>${kids}</ul>` : '') +
					`</li>`
				);
			})
			.join('');
	return `<ul>${emit(root.children)}</ul>`;
}

function navbarHtml(d: { siteName: string; root: string; showGraph?: boolean }): string {
	const home = `${d.root}`;
	return (
		`<nav class="navbar"><div class="navbar-inner">` +
		`<button class="hamburger" type="button" aria-label="Toggle navigation">${HAMBURGER}</button>` +
		`<a class="navbar-brand" href="${home}">${LOGO}<span>${escapeHtml(d.siteName)}</span></a>` +
		`<div class="navbar-search">${SEARCH_ICON}` +
		`<input type="search" placeholder="Search docs…" aria-label="Search" spellcheck="false">` +
		`</div>` +
		(d.showGraph === false
			? ''
			: `<a class="navbar-graph" href="${d.root}graph.html" aria-label="Open graph view">${GRAPH_ICON}<span>Graph</span></a>`) +
		`</div></nav>` +
		`<div class="search-results" role="listbox"></div>`
	);
}

function headTags(d: PageData): string {
	const parts = [
		'<meta charset="utf-8">',
		'<meta name="viewport" content="width=device-width, initial-scale=1">',
		`<meta name="theme-color" content="#1b1b1d">`,
		'<meta name="color-scheme" content="dark">',
		`<meta name="description" content="${escapeHtml(d.title)} — ${escapeHtml(d.siteName)} documentation">`,
		`<link rel="icon" href="${FAVICON}">`,
		`<title>${escapeHtml(d.title)} | ${escapeHtml(d.siteName)}</title>`,
		`<link rel="stylesheet" href="${d.root}assets/style.css?v=${d.version}">`,
	];
	if (d.usesMermaid && d.mermaidCdn) {
		parts.push('<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>');
	}
	return parts.join('\n');
}

function crumbsHtml(d: PageData): string {
	if (!d.showBreadcrumbs) return '';
	const items: string[] = [];
	items.push(`<a href="${d.root}">${escapeHtml(d.siteName)}</a>`);
	for (const c of d.crumbs) {
		items.push('<span class="sep">›</span>');
		items.push(c.url ? `<a href="${d.root}${c.url}">${escapeHtml(c.name)}</a>` : `<span>${escapeHtml(c.name)}</span>`);
	}
	return `<div class="breadcrumbs">${items.join('')}</div>`;
}

function metaHtml(d: PageData): string {
	const bits: string[] = [];
	const chips = d.tags.map((t) => `<a class="tag-chip" href="#">#${escapeHtml(t)}</a>`).join('');
	if (chips) bits.push(`<span class="tag-chips">${chips}</span>`);
	if (d.showLastUpdated && d.lastUpdated) bits.push(`<span class="last-updated">Last updated: ${escapeHtml(d.lastUpdated)}</span>`);
	if (bits.length === 0) return '';
	return `<div class="page-meta">${bits.join('')}</div>`;
}

function navHtml(d: PageData): string {
	if (!d.showPagination || (!d.prev && !d.next)) return '';
	const prev = d.prev
		? `<a class="pg-prev" href="${d.root}${d.prev.url}"><span class="pg-label">Previous</span><span class="pg-title">${escapeHtml(d.prev.title)}</span></a>`
		: '<span style="flex:1"></span>';
	const next = d.next
		? `<a class="pg-next" href="${d.root}${d.next.url}"><span class="pg-label">Next</span><span class="pg-title">${escapeHtml(d.next.title)}</span></a>`
		: '';
	return `<div class="page-nav">${prev}${next}</div>`;
}

function treeSidebarHtml(d: PageData): string {
	return (
		`<aside class="sidebar sidebar-left"><div class="sidebar-viewport">` +
		`<h4 class="sidebar-heading">Contents</h4>` +
		`<div class="tree">` +
		renderTree(d.tree ? d.tree.children : [], (u) => u === d.url, d.root) +
		`</div></div></aside>`
	);
}

/** Full HTML for a note page. All data urls are site-root-relative; `root` prefixes them. */
export function pageHtml(d: PageData): string {
	// prefix root for site-relative urls used in data attributes
	const toc = renderToc(d.headings);
	const tocClass = toc ? '' : ' no-toc';
	const year = new Date().getFullYear();
	return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
${headTags(d)}
</head>
<body data-page="${d.url}" data-root="${d.root}" class="${tocClass}">
${navbarHtml(d)}
<div class="layout${tocClass}">
${treeSidebarHtml(d)}
<main class="content"><div class="content-wrapper">
${crumbsHtml(d)}
<h1 class="page-title">${escapeHtml(d.title)}</h1>
${metaHtml(d)}
<div class="markdown">
${d.content}
</div>
${navHtml(d)}
<footer class="doc-footer">Copyright © ${year} ${escapeHtml(d.siteName)}. Built with <a href="#">Docs Site Export</a>.</footer>
</div></main>
${toc ? `<aside class="sidebar sidebar-right"><h4 class="toc-heading">On this page</h4><nav class="toc">${toc}</nav></aside>` : ''}
</div>
<script src="${d.root}assets/site.js?v=${d.version}"></script>
</body>
</html>`;
}

/** The interactive graph page (written to the site root as graph.html). */
export function graphHtml(opts: { siteName: string; version: string; root: string; tree: TreeFolder | null }): string {
	const d: PageData = {
		siteName: opts.siteName,
		version: opts.version,
		title: 'Graph',
		url: 'graph.html',
		root: opts.root,
		content: '',
		tree: opts.tree,
		headings: [],
		tags: [],
		crumbs: [],
		lastUpdated: null,
		showBreadcrumbs: false,
		showLastUpdated: false,
		showPagination: false,
		prev: null,
		next: null,
		showToc: true,
		usesMermaid: false,
		mermaidCdn: false,
	};
	const year = new Date().getFullYear();
	return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#1b1b1d">
<meta name="color-scheme" content="dark">
<link rel="icon" href="${FAVICON}">
<title>Graph | ${escapeHtml(opts.siteName)}</title>
<link rel="stylesheet" href="${opts.root}assets/style.css?v=${opts.version}">
</head>
<body data-page="graph.html" data-root="${opts.root}">
${navbarHtml(opts)}
<div class="layout no-toc">
${treeSidebarHtml(d)}
<div class="content graph-page">
<div id="graph-container">
<div class="graph-toolbar">
<button type="button" id="graph-freeze">Freeze layout</button>
<button type="button" id="graph-open">Open current note</button>
</div>
<div class="graph-legend"><span class="dot"></span> note &nbsp;<span class="dot current"></span> current</div>
</div>
</div>
</div>
<script src="${opts.root}assets/site.js?v=${opts.version}"></script>
</body>
</html>`;
}

/** Landing page used when no root index note was exported. */
export function landingHtml(opts: {
	siteName: string;
	version: string;
	root: string;
	tree: TreeFolder | null;
	sections: { name: string; url: string; count: number }[];
}): string {
	const year = new Date().getFullYear();
	const cards = opts.sections
		.map((s) => `<a class="landing-card" href="${opts.root}${s.url}"><div class="card-title">${escapeHtml(s.name)}</div><div class="card-count">${s.count} note${s.count === 1 ? '' : 's'}</div></a>`)
		.join('\n');
	return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#1b1b1d">
<meta name="color-scheme" content="dark">
<link rel="icon" href="${FAVICON}">
<title>${escapeHtml(opts.siteName)}</title>
<link rel="stylesheet" href="${opts.root}assets/style.css?v=${opts.version}">
</head>
<body data-page="index.html" data-root="${opts.root}">
${navbarHtml(opts)}
<div class="layout no-sidebar">
<main class="content"><div class="content-wrapper">
<div class="landing-hero">
<h1 class="landing-title">${escapeHtml(opts.siteName)} <span class="accent">Docs</span></h1>
<p class="landing-sub">Browse the sections below. Use the sidebar or the search bar to jump straight to any note.</p>
</div>
<div class="landing-grid">
${cards}
</div>
<footer class="doc-footer">Copyright © ${year} ${escapeHtml(opts.siteName)}.</footer>
</div></main>
</div>
<script src="${opts.root}assets/site.js?v=${opts.version}"></script>
</body>
</html>`;
}
