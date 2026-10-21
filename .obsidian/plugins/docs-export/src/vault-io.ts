import { App, TFile } from 'obsidian';

/** Read a file's binary contents via the vault adapter (works on desktop). */
export async function readBinary(app: App, file: TFile): Promise<ArrayBuffer> {
	return app.vault.adapter.readBinary(file.path);
}
