import { App, TFile, TFolder, Vault } from 'obsidian';
import type { DocsExportSettings } from './settings';

/** True when `path` equals `entry` or lives underneath it. */
function coveredBy(list: string[], path: string): boolean {
	for (const entry of list) {
		if (path === entry || path.startsWith(entry + '/')) return true;
	}
	return false;
}

/**
 * Whether a markdown file is part of the export per the current include/exclude
 * selection. An empty include list means "everything" (dot-directories are
 * always skipped by the caller).
 */
export function isFileIncluded(settings: DocsExportSettings, file: TFile): boolean {
	const path = file.path;
	if (coveredBy(settings.exclude, path)) return false;
	return settings.include.length === 0 || coveredBy(settings.include, path);
}

/** All markdown files that may appear in the picker / export set. */
export function allMarkdownFiles(app: App): TFile[] {
	return app.vault
		.getMarkdownFiles()
		.filter((f) => !f.path.split('/').some((seg) => seg.startsWith('.')))
		.sort((a, b) => a.path.localeCompare(b.path, undefined, { sensitivity: 'base' }));
}

export function countIncluded(settings: DocsExportSettings, files: TFile[]): number {
	return files.filter((f) => isFileIncluded(settings, f)).length;
}

function removeMatching(list: string[], predicate: (entry: string) => boolean) {
	for (let i = list.length - 1; i >= 0; i--) if (predicate(list[i])) list.splice(i, 1);
}

const covers = (a: string, b: string) => a === b || a.startsWith(b + '/') || b.startsWith(a + '/');

/**
 * Turn entry `path` (file or folder) on. Removes overriding exclusions and, if
 * the include list is explicit, adds an entry covering the path.
 */
export function selectEntry(settings: DocsExportSettings, path: string) {
	// Drop exclusions that would hide this entry (entry itself or an ancestor of it)
	removeMatching(settings.exclude, (e) => path === e || path.startsWith(e + '/'));
	// Fold descendants into this entry to keep lists tidy, when explicitly listing
	removeMatching(settings.include, (e) => e.startsWith(path + '/'));
	if (settings.include.length > 0 && !coveredBy(settings.include, path)) {
		settings.include.push(path);
	}
}

/** Turn entry `path` (file or folder) off. Exclusions win over explicit includes. */
export function deselectEntry(settings: DocsExportSettings, path: string) {
	removeMatching(settings.include, (e) => e === path || e.startsWith(path + '/'));
	if (!coveredBy(settings.exclude, path)) {
		settings.exclude.push(path);
	}
}

/** Checkbox state for the picker: "on" | "off" | "partial" (folders only). */
export function entryState(settings: DocsExportSettings, path: string, isFolder: boolean): 'on' | 'off' | 'partial' {
	const included = isFileIncludedPath(settings, path);
	if (!isFolder) return included ? 'on' : 'off';
	// Folder: check a sample of descendants to detect partial state
	const someIn = hasDescendantState(settings, path, true);
	const all = !hasDescendantState(settings, path, false);
	if (included && all) return 'on';
	if (!included && !someIn) return 'off';
	return 'partial';
}

function isFileIncludedPath(settings: DocsExportSettings, path: string): boolean {
	if (coveredBy(settings.exclude, path)) return false;
	return settings.include.length === 0 || coveredBy(settings.include, path);
}

function hasDescendantState(settings: DocsExportSettings, folder: string, wanted: boolean): boolean {
	const prefix = folder + '/';
	return settings.include.concat(settings.exclude).some((entry) => {
		if (!entry.startsWith(prefix)) return false;
		return isFileIncludedPath(settings, entry) === wanted;
	});
}

/** Path of the picker tree root (the vault root folder object). */
export function vaultRoot(vault: Vault): TFolder {
	return vault.getRoot();
}
