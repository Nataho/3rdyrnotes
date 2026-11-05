import { App, TFile } from 'obsidian';

/**
 * Turns note references like "ITS 300/subnotes/Symfony.md" inside rendered
 * chat text into clickable spans that open the corresponding vault note.
 * Only references that unambiguously resolve to a real note become links;
 * all other text stays untouched so no dead links appear.
 */

const LINK_CLASS = 'compainion-note-link';
const SKIPPED_TAGS = new Set(['A', 'CODE', 'PRE', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'BUTTON']);
/** Prose words glued in front of a real path (e.g. "see Docker.md") are retried without them. */
const MAX_LEFT_TRIMS = 5;

/** One candidate note reference, possibly with leading prose words. */
interface MappedPiece {
	text: string;
	file: TFile | null;
}

/**
 * Resolve one candidate reference to a vault note. Order: exact path,
 * case-insensitive full path, unique path suffix, unique note name.
 * Ambiguous or missing references resolve to null.
 */
function resolveNotePath(app: App, candidate: string): TFile | null {
	const trimmed = candidate.trim();
	if (trimmed.length < 4 || !trimmed.toLowerCase().endsWith('.md')) {
		return null;
	}
	const direct = app.vault.getAbstractFileByPath(trimmed);
	if (direct instanceof TFile && direct.extension.toLowerCase() === 'md') {
		return direct;
	}
	const lower = trimmed.toLowerCase();
	const files = app.vault.getMarkdownFiles();
	const fullMatches = files.filter((file) => file.path.toLowerCase() === lower);
	if (fullMatches.length === 1) {
		return fullMatches[0];
	}
	const suffixMatches = files.filter((file) => file.path.toLowerCase().endsWith(lower));
	if (suffixMatches.length === 1) {
		return suffixMatches[0];
	}
	const nameMatches = files.filter((file) => file.name.toLowerCase() === lower);
	if (nameMatches.length === 1) {
		return nameMatches[0];
	}
	return null;
}

interface TrimmedResolution {
	file: TFile;
	linkText: string;
}

/**
 * Resolve a candidate, retrying without leading prose words ("see Docker.md"
 * resolves once "see " is dropped). Returns the file plus the exact substring
 * that should become the link.
 */
function resolveWithTrim(app: App, candidate: string): TrimmedResolution | null {
	const trimmed = candidate.trim();
	if (!trimmed.length) {
		return null;
	}
	const tokens = trimmed.split(' ');
	const limit = Math.min(MAX_LEFT_TRIMS, tokens.length);
	for (let offset = 0; offset < limit; offset += 1) {
		const linkText = tokens.slice(offset).join(' ');
		const file = resolveNotePath(app, linkText);
		if (file) {
			return { file, linkText };
		}
	}
	return null;
}

/**
 * Class per character of a path candidate: letters, digits, spaces, dashes,
 * dots, slashes and common punctuation. Quotes and ticks deliberately break
 * the match so quoted references stay clean.
 */
const REF_PATTERN_SOURCE = "[A-Za-z0-9][A-Za-z0-9 ()\\-,.'\\u2019&_+/]*\\.[mM][dD](?![A-Za-z0-9_./])";

/**
 * A greedy group can swallow words past an inner ".md" boundary
 * ("main.md and styles.md" becomes one wrong candidate). This finds the
 * first ".md" inside such a match so the candidate is cut there and the
 * remaining text is scanned again on its own.
 */
function firstMdBoundary(candidate: string): number {
	const cut = candidate.toLowerCase().indexOf('.md');
	return cut === -1 ? candidate.length : cut + '.md'.length;
}

/** Split one text node into plain and (linkable) candidate pieces. */
function mapTextToPieces(app: App, text: string): MappedPiece[] {
	const pieces: MappedPiece[] = [];
	const pattern = new RegExp(REF_PATTERN_SOURCE, 'g');
	let cursor = 0;
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(text)) !== null) {
		const matchStart = match.index;
		const matchEnd = pattern.lastIndex;
		const candidate = text.slice(matchStart, matchEnd);
		const boundary = matchStart + firstMdBoundary(candidate);
		pieces.push({ text: text.slice(cursor, matchStart), file: null });
		const innerCandidate = text.slice(matchStart, boundary);
		const resolution = resolveWithTrim(app, innerCandidate);
		if (resolution) {
			const lead = innerCandidate.slice(0, innerCandidate.indexOf(resolution.linkText));
			if (lead.length > 0) {
				pieces.push({ text: lead, file: null });
			}
			pieces.push({ text: resolution.linkText, file: resolution.file });
			if (lead.length + resolution.linkText.length < innerCandidate.length) {
				pieces.push({ text: innerCandidate.slice(lead.length + resolution.linkText.length), file: null });
			}
		} else {
			pieces.push({ text: innerCandidate, file: null });
		}
		cursor = boundary;
		if (pattern.lastIndex <= boundary) {
			pattern.lastIndex = boundary;
		}
	}
	if (cursor < text.length) {
		pieces.push({ text: text.slice(cursor), file: null });
	}
	return pieces.filter((piece) => piece.text.length > 0);
}

/** Split a text node into plain text plus clickable note references in place. */
function processTextNode(textNode: Text, app: App): void {
	const text = textNode.data;
	if (!/[A-Za-z0-9][A-Za-z0-9 ()\-,.'&_+/]*\.[mM][dD]/.test(text)) {
		return;
	}
	const pieces = mapTextToPieces(app, text);
	if (pieces.every((piece) => piece.file === null)) {
		return;
	}
	const parent = textNode.parentNode;
	if (!parent) {
		return;
	}
	const fragment = document.createDocumentFragment();
	for (const piece of pieces) {
		if (!piece.file) {
			fragment.appendChild(document.createTextNode(piece.text));
			continue;
		}
		const link = document.createElement('span');
		link.className = LINK_CLASS;
		link.setAttribute('aria-label', `Open ${piece.file.path}`);
		link.appendChild(document.createTextNode(piece.text));
		link.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopPropagation();
			void app.workspace.openLinkText(piece.file!.path, '', false);
		});
		fragment.appendChild(link);
	}
	parent.replaceChild(fragment, textNode);
}

/** Recursively linkify note references inside one rendered block. */
export function linkifyNotePaths(root: HTMLElement, app: App): void {
	const walk = (node: Node): void => {
		if (node.nodeType === Node.TEXT_NODE) {
			processTextNode(node as Text, app);
			return;
		}
		if (node.nodeType !== Node.ELEMENT_NODE) {
			return;
		}
		const element = node as HTMLElement;
		if (SKIPPED_TAGS.has(element.tagName) || element.classList.contains(LINK_CLASS)) {
			return;
		}
		for (const child of Array.from(element.childNodes)) {
			walk(child);
		}
	};
	for (const child of Array.from(root.childNodes)) {
		walk(child);
	}
}
