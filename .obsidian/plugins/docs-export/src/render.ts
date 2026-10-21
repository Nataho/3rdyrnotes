import { Marked, type Tokens } from 'marked';
import hljs from 'highlight.js/lib/common';
import type { App, TFile } from 'obsidian';

export interface HeadingInfo {
	level: number;
	text: string;
	slug: string;
}

export interface RenderCtx {
	app: App;
	/** resolves a linkpath exactly like Obsidian does */
	resolveDest: (linkpath: string, sourcePath: string) => TFile | null;
	/**
	 * copies an asset file (once) and returns an `oasset://` token URL.
	 * The exporter rewrites these into per-page-relative asset URLs after render.
	 */
	copyAsset: (file: TFile) => string;
	/** true when the file is part of the export set */
	isExported: (file: TFile) => boolean;
	/** page URL for an exported file */
	urlFor: (file: TFile) => string;
	/** renders (or returns the memoized render of) a nested note embed */
	child: (file: TFile, depth: number) => Promise<{ html: string; title: string } | null>;
}

export interface RenderResult {
	html: string;
	title: string;
	tags: string[];
	headings: HeadingInfo[];
	outgoing: TFile[];
	usesMermaid: boolean;
}

const MAX_EMBED_DEPTH = 3;

export function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function slugify(text: string): string {
	return text
		.replace(/[*_~`#]+/g, '')
		.replace(/\[\[([^\]\|]+)(?:\|[^\]]*)?\]\]/g, '$1')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[^\p{L}\p{N}\s-]/gu, '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
}

interface Frontmatter {
	title: string | null;
	tags: string[];
	rest: string; // content without frontmatter
}

function parseFrontmatter(content: string): Frontmatter {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!match) return { title: null, tags: [], rest: content };
	const tags: string[] = [];
	let title: string | null = null;
	let lastKey = '';
	for (const rawLine of match[1].split(/\r?\n/)) {
		if (!rawLine.trim() || rawLine.trim() === '---') continue;
		const listItem = rawLine.match(/^\s+-\s*(.*)$/);
		if (listItem && lastKey === 'tags') {
			const t = unquote(listItem[1].trim());
			if (t) tags.push(t);
			continue;
		}
		const kv = rawLine.match(/^([\w-]+)\s*:\s*(.*)$/);
		if (kv) {
			lastKey = kv[1].toLowerCase();
			const value = unquote(kv[2].trim());
			if (lastKey === 'title' && value) title = value;
			else if (lastKey === 'tags' && value && value !== '-' && !value.startsWith('#')) {
				if (value.startsWith('[') && value.endsWith(']')) {
					for (const t of value.slice(1, -1).split(',')) {
						const tt = unquote(t.trim());
						if (tt) tags.push(tt);
					}
				} else tags.push(value);
			}
		}
	}
	return { title, tags, rest: content.slice(match[0].length) };
}

function unquote(s: string): string {
	if (s.length >= 2 && ((s[0] === '"' && s.endsWith('"')) || (s[0] === "'" && s.endsWith("'")))) return s.slice(1, -1);
	return s;
}

const CALLOUT_ALIASES: Record<string, string> = {
	note: 'note', info: 'info', todo: 'info', abstract: 'info', summary: 'info', tldr: 'info',
	tip: 'tip', hint: 'tip', important: 'tip',
	success: 'success', check: 'success', done: 'success',
	question: 'question', help: 'question', faq: 'question',
	warning: 'warning', caution: 'warning', attention: 'warning',
	danger: 'danger', error: 'danger', failure: 'danger', fail: 'danger', missing: 'danger',
	bug: 'bug', example: 'example', quote: 'quote', cite: 'quote',
};

function calloutIcon(type: string): string {
	switch (type) {
		case 'note': return ICON_PENCIL;
		case 'info': return ICON_INFO;
		case 'tip': return ICON_BULB;
		case 'success': return ICON_CHECK;
		case 'question': return ICON_HELP;
		case 'warning': return ICON_WARNING;
		case 'danger': return ICON_OCTAGON;
		case 'bug': return ICON_BUG;
		case 'example': return ICON_LIST;
		case 'quote': return ICON_QUOTE;
		default: return ICON_INFO;
	}
}

export async function renderMarkdown(ctx: RenderCtx, file: TFile, content: string, depth: number): Promise<RenderResult> {
	const fm = parseFrontmatter(content);
	let md = fm.rest;

	interface State {
		tags: Set<string>;
		headings: HeadingInfo[];
		outgoing: Map<string, TFile>;
		usesMermaid: boolean;
		slugCounts: Map<string, number>;
	}
	const state: State = {
		tags: new Set(),
		headings: [],
		outgoing: new Map(),
		usesMermaid: false,
		slugCounts: new Map(),
	};

	// ---------- pre-pass: wiki syntax on non-code text ----------
	md = transformOutsideCode(md, (piece, isHeadingLine) => {
		piece = stripTrailingHeadingHashes(piece);
		piece = piece.replace(/==([^=\n]+)==/g, '<mark>$1</mark>');
		piece = piece.replace(EMBED_RE, (_m, target: string) => {
			const t = target.trim();
			if (!t) return _m;
			const payload = encodeURIComponent(JSON.stringify({ t }));
			return `![embed](oembed://${payload})`;
		});
		piece = piece.replace(WIKI_RE, (_m, target: string, heading: string | undefined, label: string | undefined) => {
			const t = target.trim();
			if (!t) return escapeHtml(_m);
			const text = label && label.trim() ? label : t;
			const payload = encodeURIComponent(JSON.stringify({ t, h: heading ? heading.slice(1) : null }));
			return `[${text}](olink://${payload})`;
		});
		if (!isHeadingLine) {
			piece = piece.replace(TAG_RE, (m, pre: string, tag: string) => {
				state.tags.add(tag);
				return `${pre}<span class="md-tag">#${tag}</span>`;
			});
		}
		piece = piece.replace(AUTOLINK_RE, '$1[$2]($2)');
		return piece;
	});

	// ---------- marked ----------
	const usedSlugs = new Map<string, number>();
	const slugifyHeading = (plain: string): string => {
		let slug = slugify(plain) || 'section';
		const n = usedSlugs.get(slug) ?? 0;
		usedSlugs.set(slug, n + 1);
		return n > 0 ? `${slug}-${n}` : slug;
	};

	const marked = new Marked({ gfm: true, breaks: true, async: false });
	marked.use({
		renderer: {
			code(token: Tokens.Code): string {
				const lang = (token.lang || '').split(/\s+/)[0].toLowerCase();
				if (lang === 'dataview' || lang === 'dataviewjs' || lang === 'dataview-inline') return '';
				if (lang === 'mermaid') {
					state.usesMermaid = true;
					return `<div class="mermaid-block"><pre class="mermaid">${escapeHtml(token.text)}</pre></div>`;
				}
				let highlighted: string;
				try {
					highlighted = lang && hljs.getLanguage(lang)
						? hljs.highlight(token.text, { language: lang, ignoreIllegals: true }).value
						: escapeHtml(token.text);
				} catch {
					highlighted = escapeHtml(token.text);
				}
				const label = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : '<span class="code-lang"></span>';
				return (
					`<div class="code-block"${lang ? ` data-lang="${escapeHtml(lang)}"` : ''}>` +
					`<div class="code-topbar">${label}` +
					`<button class="code-copy" type="button">${ICON_COPY}<span>Copy</span></button></div>` +
					`<pre><code class="hljs">${highlighted}</code></pre></div>`
				);
			},
			heading(token: Tokens.Heading): string {
				const inner = this.parser.parseInline(token.tokens);
				const plain = plainTextOf(token.tokens);
				const slug = slugifyHeading(plain);
				state.headings.push({ level: token.depth, text: plain, slug });
				return `<h${token.depth} id="${slug}">${inner}</h${token.depth}>\n`;
			},
			link(token: Tokens.Link): string {
				const inner = this.parser.parseInline(token.tokens);
				const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
				if (token.href.startsWith('olink://')) {
					const info = decodePayload(token.href.slice('olink://'.length));
					if (!info) return `<span class="md-unresolved">${inner}</span>`;
					const dest = ctx.resolveDest(info.t, file.path);
					if (!dest) return `<span class="md-unresolved">${inner}</span>`;
					if (!ctx.isExported(dest)) return `<span class="md-not-included" title="This note is not part of the exported site">${inner}</span>`;
					state.outgoing.set(dest.path, dest);
					const token2 = 'oroot://' + encodeURIComponent(ctx.urlFor(dest) + (info.h ? '#' + slugify(info.h) : ''));
					return `<a href="${token2}"${title}>${inner}</a>`;
				}
				if (/^https?:\/\//i.test(token.href)) {
					return `<a href="${escapeHtml(token.href)}" target="_blank" rel="noopener"${title}>${inner}</a>`;
				}
				if (/\.md(#.*)?$/i.test(token.href)) {
					const [target, anchor] = token.href.split('#');
					const dest = ctx.resolveDest(decodeURIComponent(target), file.path);
					if (dest && ctx.isExported(dest)) {
						state.outgoing.set(dest.path, dest);
						return `<a href="oroot://${encodeURIComponent(ctx.urlFor(dest) + (anchor ? '#' + slugify(decodeURIComponent(anchor)) : ''))}"${title}>${inner}</a>`;
					}
					return `<span class="md-not-included">${inner}</span>`;
				}
				if (token.href.startsWith('#')) return `<a href="${escapeHtml(token.href)}"${title}>${inner}</a>`;
				return `<a href="${escapeHtml(token.href)}"${title}>${inner}</a>`;
			},
			image(token: Tokens.Image): string {
				if (token.href.startsWith('oembed://')) {
					const info = decodePayload(token.href.slice('oembed://'.length));
					if (!info) return '';
					const dest = ctx.resolveDest(info.t, file.path);
					if (!dest) {
						return `<span class="md-embed-broken">Embedded file not found: ${escapeHtml(info.t)}</span>`;
					}
					if (dest.extension === 'md') {
						// note embed — replaced asynchronously after parse (md-embed-slot)
						state.outgoing.set(dest.path, dest);
						return `<div class="md-embed-slot" data-vault-embed="${token.href.slice('oembed://'.length)}" data-vault-depth="${depth + 1}"></div>`;
					}
					// media attachment (image, video, pdf…)
					const url = ctx.copyAsset(dest);
					const ext = (dest.extension || '').toLowerCase();
					if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'avif'].includes(ext)) {
						return `<img src="${url}" alt="${escapeHtml(token.text || dest.basename)}" loading="lazy">`;
					}
					if (['mp4', 'webm', 'ogv', 'mov'].includes(ext)) {
						return `<video controls src="${url}" class="md-video"></video>`;
					}
					return `<a class="md-file-embed" href="${url}" target="_blank">` +
						`<span class="md-file-icon">${ICON_FILE}</span><span>${escapeHtml(dest.name ?? dest.basename)}</span></a>`;
				}
				// plain markdown image, possibly a vault-relative attachment
				let resolved: TFile | null = null;
				try { resolved = ctx.resolveDest(decodeURIComponent(token.href), file.path); } catch { resolved = null; }
				const url = resolved ? ctx.copyAsset(resolved) : escapeHtml(token.href);
				return `<img src="${url}" alt="${escapeHtml(token.text || '')}" loading="lazy"${token.title ? ` title="${escapeHtml(token.title)}"` : ''}>`;
			},
			table(token: Tokens.Table): string {
				const align = (i: number) => (token.align[i] ? ` style="text-align:${token.align[i]}"` : '');
				const head = `<tr>${token.header
					.map((c, i) => `<th${align(i)}>${this.parser.parseInline(c.tokens)}</th>`)
					.join('')}</tr>`;
				const body = token.rows
					.map((r) => `<tr>${r.map((c, i) => `<td${align(i)}>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`)
					.join('');
				return `<div class="table-wrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>\n`;
			},
		},
	});

	let html = marked.parse(md) as string;

	// ---------- note embeds (async slot replacement) ----------
	let html2 = html;
	const slotRe = /<div class="md-embed-slot" data-vault-embed="([^"]+)" data-vault-depth="(\d+)"><\/div>/g;
	for (const m of [...html.matchAll(slotRe)]) {
		const [full, payload, depthStr] = m;
		const info = decodePayload(payload);
		let replacement: string;
		const dest = info ? ctx.resolveDest(info.t, file.path) : null;
		if (!dest) {
			replacement = `<span class="md-embed-broken">Embedded note not found or not exported: ${escapeHtml(info?.t ?? payload)}</span>`;
		} else if (Number(depthStr) > MAX_EMBED_DEPTH) {
			replacement = `<div class="md-embed md-embed-deep"><span>Nested embed limit reached: ${escapeHtml(dest.basename)}</span></div>`;
		} else {
			const child = await ctx.child(dest, Number(depthStr));
			replacement = child
				? `<div class="md-embed">` +
					`<a class="md-embed-title" href="oroot://${encodeURIComponent(ctx.urlFor(dest))}">${escapeHtml(child.title)}</a>` +
					`<div class="md-embed-body">${child.html}</div></div>`
				: `<div class="md-embed md-embed-deep"><span>Cyclic embed skipped: ${escapeHtml(dest.basename)}</span></div>`;
		}
		html2 = html2.replace(full, () => replacement);
	}
	html = html2;

	// ---------- callouts ----------
	html = html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (_m, inner: string) => buildCallout(inner));

	return {
		html,
		title: fm.title || file.basename,
		tags: Array.from(new Set([...fm.tags, ...state.tags])),
		headings: state.headings,
		outgoing: Array.from(state.outgoing.values()),
		usesMermaid: state.usesMermaid,
	};
}

// ---------- pre-pass helpers ----------

const EMBED_RE = /!\[\[([^\]\[]+?)\s*(?:#[^\]\[]*)?(?:\|[^\]\[]*)?\]\]/g;
const WIKI_RE = /\[\[([^\]\[]+?)\s*(#[^\]\[|]+)?(?:\|([^\]\[]*))?\]\]/g;
const TAG_RE = /(^|[\s(\[])#([A-Za-z][\w-]*(?:\/[\w-]+)*)/g;
const AUTOLINK_RE = /(^|\s)(https?:\/\/[^\s<>()[\]]+)/g;

function decodePayload(payload: string): { t: string; h: string | null } | null {
	try {
		const parsed = JSON.parse(decodeURIComponent(payload));
		if (typeof parsed?.t === 'string') return { t: parsed.t, h: typeof parsed.h === 'string' ? parsed.h : null };
	} catch { /* fallthrough */ }
	try {
		// fallback: raw encoded linkpath
		return { t: decodeURIComponent(payload), h: null };
	} catch {
		return null;
	}
}

/**
 * Applies a text transform everywhere except inside fenced code blocks and
 * inline code spans. Passes a `isHeadingLine` flag to the transform (used to
 * skip tag styling inside headings).
 */
function transformOutsideCode(md: string, apply: (piece: string, isHeadingLine: boolean) => string): string {
	const lines = md.split(/\r?\n/);
	let inFence = false;
	let fenceChar = '';
	let fenceLen = 0;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const isHeadingLine = /^#{1,6}\s/.test(line);
		const opener = line.match(/^(\s*)([`~]{3,})/);
		if (opener) {
			const c = opener[2][0];
			const n = opener[2].length;
			if (!inFence) {
				inFence = true;
				fenceChar = c;
				fenceLen = n;
				continue;
			}
			const trimmed = line.trim();
			if (trimmed[0] === fenceChar && trimmed.length >= fenceLen && /^[`~]+$/.test(trimmed)) {
				inFence = false;
				continue;
			}
			continue; // inside fence, untouched
		}
		if (inFence) continue;
		// protect inline code spans
		const parts = line.split(/(`[^`]*`)/g);
		lines[i] = parts.map((part, idx) => (idx % 2 === 1 ? part : apply(part, isHeadingLine))).join('');
	}
	return lines.join('\n');
}

/** Obsidian drops trailing `###` on ATX headings. */
function stripTrailingHeadingHashes(line: string): string {
	if (!/^#{1,6}\s/.test(line)) return line;
	return line.replace(/^([\s\S]*?)(\s+#+\s*)$/, '$1');
}

/** Recursively derive plain text from inline tokens (used for heading slugs). */
function plainTextOf(tokens: any[] | undefined): string {
	if (!tokens) return '';
	return tokens
		.map((t: any) => {
			if (t.type === 'html') return '';
			if (t.tokens) return plainTextOf(t.tokens);
			return t.type === 'image' ? (t.text || '') : (t.text || '');
		})
		.join('');
}

// ---------- callout construction ----------

function buildCallout(inner: string): string {
	const firstPEnd = inner.indexOf('</p>');
	const head = firstPEnd >= 0 ? inner.slice(0, firstPEnd) : inner;
	const rest = firstPEnd >= 0 ? inner.slice(firstPEnd + 4) : '';
	const pContent = head.replace(/^\s*<p>/, '');
	const marker = pContent.match(/^\[!(\w+)\]([+-]?)\s*([\s\S]*)$/);
	if (!marker) {
		return `<blockquote>${inner}</blockquote>`;
	}
	const rawType = marker[1].toLowerCase();
	const foldMark = marker[2];
	const remainder = marker[3];

	const type = CALLOUT_ALIASES[rawType] || 'note';
	const defaultTitle = rawType.charAt(0).toUpperCase() + rawType.slice(1);

	let title = defaultTitle;
	let inlineBody = '';
	const brIndex = remainder.indexOf('<br>');
	if (brIndex >= 0) {
		title = remainder.slice(0, brIndex).trim() || defaultTitle;
		inlineBody = remainder.slice(brIndex + 4).trim();
	} else {
		title = remainder.trim() || defaultTitle;
	}

	const bodyRest = inlineBody ? `<p>${inlineBody}</p>` : '';
	const bodyHtml = bodyRest + rest;

	const titleHtml = `${calloutIcon(type)}<span class="callout-title-text">${title}</span>`;
	if (foldMark) {
		const open = foldMark === '+' ? ' open' : '';
		return (
			`<details class="callout is-collapsible"${open} data-callout="${type}">` +
			`<summary class="callout-title">${titleHtml}<span class="callout-fold">${ICON_FOLD}</span></summary>` +
			`<div class="callout-content">${bodyHtml}</div></details>`
		);
	}
	return (
		`<div class="callout" data-callout="${type}">` +
		`<div class="callout-title">${titleHtml}</div>` +
		`<div class="callout-content">${bodyHtml}</div></div>`
	);
}

// ---------- inline svg icons ----------

const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICON_PENCIL = svg('<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>');
const ICON_INFO = svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>');
const ICON_BULB = svg('<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>');
const ICON_CHECK = svg('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>');
const ICON_HELP = svg('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>');
const ICON_WARNING = svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>');
const ICON_OCTAGON = svg('<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>');
const ICON_BUG = svg('<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>');
const ICON_LIST = svg('<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>');
const ICON_QUOTE = svg('<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>');
const ICON_COPY = svg('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>');
const ICON_FILE = svg('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>');
const ICON_FOLD = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
