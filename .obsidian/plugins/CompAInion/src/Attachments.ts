import { App, TFile, normalizePath } from 'obsidian';

/** Clipboard images become vault attachments; other content keeps normal paste behavior. */
export const MAX_IMAGES_PER_INGEST = 4;
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const FALLBACK_ATTACHMENT_FOLDER = 'CompAInion Files';

/** Extract image files from a paste event; empty result keeps default text pasting. */
export function imageFilesFromClipboard(event: ClipboardEvent): File[] {
	const items = event.clipboardData?.items;
	const out: File[] = [];
	if (!items) {
		return out;
	}
	for (let index = 0; index < items.length; index += 1) {
		const item = items[index];
		if (item.kind === 'file' && /^image\//i.test(item.type)) {
			const file = item.getAsFile();
			if (file) {
				out.push(file);
			}
		}
	}
	return out;
}

/** Extract image files from a drag-and-drop onto the chat input. */
export function imageFilesFromDrop(event: DragEvent): File[] {
	const files = event.dataTransfer?.files;
	const out: File[] = [];
	if (!files) {
		return out;
	}
	for (const file of Array.from(files)) {
		if (/^image\//i.test(file.type)) {
			out.push(file);
		}
	}
	return out;
}

export interface ApprovedImages {
	approved: File[];
	oversized: File[];
	overflow: File[];
}

/** Split candidates into keepers, oversized rejects and count-overflow rejects. */
export function approveImages(candidates: File[]): ApprovedImages {
	const oversized: File[] = [];
	const keepable: File[] = [];
	for (const file of candidates) {
		if (file.size > MAX_ATTACHMENT_BYTES) {
			oversized.push(file);
		} else {
			keepable.push(file);
		}
	}
	return {
		approved: keepable.slice(0, MAX_IMAGES_PER_INGEST),
		oversized,
		overflow: keepable.slice(MAX_IMAGES_PER_INGEST),
	};
}

const IMAGE_EXTENSIONS: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'image/svg+xml': 'svg',
	'image/bmp': 'bmp',
	'image/tiff': 'tif',
};

/** Clipboard providers often give blank/generic names; give those a timestamp name. */
const GENERIC_NAME = /^(image|screenshot|pasted|clipboard|attachment)\b/i;

function sanitizeAttachmentName(rawName: string, mimeType: string): string {
	let base = (rawName ?? '').trim();
	if (!base.length) {
		base = 'screenshot';
	}
	const dotIndex = base.lastIndexOf('.');
	const rawStem = dotIndex > 0 ? base.slice(0, dotIndex) : base;
	let extension = dotIndex > 0 ? base.slice(dotIndex + 1) : '';
	if (!/^[a-z0-9]{1,8}$/i.test(extension)) {
		extension = IMAGE_EXTENSIONS[mimeType.toLowerCase()] ?? 'png';
	}
	const stem = rawStem
		.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
		.replace(/\s+/g, ' ')
		.trim();
	const now = new Date();
	const stamp = [now.getHours(), now.getMinutes(), now.getSeconds()]
		.map((part) => String(part).padStart(2, '0'))
		.join('');
	const cleanStem = GENERIC_NAME.test(stem) || stem.length === 0 ? `screenshot-${stamp}` : stem;
	return `${cleanStem}.${extension.toLowerCase()}`;
}

/** Save binary image data where the user configured Obsidian attachments to live. */
export async function saveAttachmentToVault(
	app: App,
	originalName: string,
	mimeType: string,
	data: ArrayBuffer,
): Promise<TFile> {
	const name = sanitizeAttachmentName(originalName, mimeType);
	let availablePath: string;
	try {
		availablePath = await Promise.resolve(app.fileManager.getAvailablePathForAttachment(name, ''));
	} catch {
		availablePath = await fallbackUniquePath(app, name);
	}
	const path = normalizePath(availablePath);
	return await app.vault.createBinary(path, data);
}

/** Deterministic fallback (used only when the attachment resolver fails). */
async function fallbackUniquePath(app: App, name: string): Promise<string> {
	const folder = normalizePath(FALLBACK_ATTACHMENT_FOLDER);
	if (!app.vault.getAbstractFileByPath(folder)) {
		try {
			await app.vault.createFolder(folder);
		} catch {
			// Concurrent creation; the next lookups resolve the winner.
		}
	}
	const dotIndex = name.lastIndexOf('.');
	const stem = dotIndex > 0 ? name.slice(0, dotIndex) : name;
	const extension = dotIndex > 0 ? name.slice(dotIndex) : '';
	for (let attempt = 0; attempt < 500; attempt += 1) {
		const candidate = attempt === 0
			? `${folder}/${name}`
			: `${folder}/${stem} ${attempt}${extension}`;
		if (!app.vault.getAbstractFileByPath(candidate)) {
			return candidate;
		}
	}
	return `${folder}/${stem} ${Date.now()}${extension}`;
}
