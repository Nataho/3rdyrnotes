import { App, Modal, Notice, Plugin, Setting } from 'obsidian';
import type { DocsExportSettings } from './settings';
import { DEFAULT_LAST_EXPORT_PATH, DEFAULT_SETTINGS } from './settings';
import { DocsExportSettingTab } from './settings-tab';
import { exportSite } from './exporter';
import { allMarkdownFiles, countIncluded } from './selection';

export default class DocsExportPlugin extends Plugin {
	settings: DocsExportSettings = { ...DEFAULT_SETTINGS };

	async onload() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) ?? {},
		) as DocsExportSettings;

		this.addSettingTab(new DocsExportSettingTab(this.app, this));

		this.addCommand({
			id: 'export-site',
			name: 'Export vault to documentation site',
			callback: () => this.openExportModal(),
		});

		this.addRibbonIcon('file-down', 'Export documentation site', () => this.openExportModal());
	}

	onunload() {}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	openExportModal() {
		new ExportModal(this.app, this).open();
	}
}

class ExportModal extends Modal {
	plugin: DocsExportPlugin;
	private pathInput: HTMLInputElement | null = null;
	private rememberToggle: boolean;

	constructor(app: App, plugin: DocsExportPlugin) {
		super(app);
		this.plugin = plugin;
		this.rememberToggle = plugin.settings.rememberPath;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass('docs-export-modal');
		const n = countIncluded(this.plugin.settings, allMarkdownFiles(this.app));

		this.titleEl.setText('Export documentation site');

		new Setting(contentEl)
			.setName('Destination folder')
			.setDesc(`The site (HTML pages, search index, graph) will be written here.`)
			.addText((text) => {
				this.pathInput = text.inputEl;
				text.inputEl.style.width = '100%';
				text.setPlaceholder(DEFAULT_LAST_EXPORT_PATH).setValue(this.plugin.settings.lastExportPath);
				return text;
			});

		new Setting(contentEl)
			.setName('Remember this folder')
			.setDesc('Pre-fills the destination on the next export.')
			.addToggle((t) =>
				t.setValue(this.rememberToggle).onChange((v) => {
					this.rememberToggle = v;
				}),
			);

		const summary = contentEl.createEl('p', { cls: 'docs-export-modal-summary' });
		summary.textContent =
			`${n} note${n === 1 ? '' : 's'} will be exported as a ` +
			`dark documentation site (file tree, search, outlines, graph view).`;

		const footer = contentEl.createDiv({ cls: 'docs-export-modal-footer' });
		footer.createEl('button', { cls: 'mod-cta', text: 'Export' }).addEventListener('click', () => this.submit());
		footer.createEl('button', { text: 'Cancel' }).addEventListener('click', () => this.close());

		contentEl.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
				e.preventDefault();
				this.submit();
			}
		});

		setTimeout(() => this.pathInput?.focus(), 30);
	}

	submit() {
		const dest = this.pathInput?.value?.trim() ?? '';
		if (!dest) {
			new Notice('Enter an export folder first.');
			this.pathInput?.focus();
			return;
		}
		if (this.rememberToggle) {
			this.plugin.settings.rememberPath = true;
			this.plugin.settings.lastExportPath = dest;
			this.plugin.saveSettings();
		} else {
			this.plugin.settings.rememberPath = false;
			this.plugin.saveSettings();
		}
		this.close();
		this.runExport(dest);
	}

	private runExport(dest: string) {
		const progress = new Notice('Preparing export…', 0);
		const started = Date.now();
		exportSite(this.app, this.plugin.settings, dest, {
			onFileDone: (done, total, current) => {
				progress.setMessage ? progress.setMessage(`Rendering ${done}/${total} — ${current}`) : null;
			},
		})
			.then((summary) => {
				progress.hide();
				const secs = Math.max(1, Math.round((Date.now() - started) / 1000));
				new Notice(
					`Exported ${summary.pages} pages (${summary.attachments} attachments) to\n${summary.dest} in ${secs}s`,
					8000,
				);
			})
			.catch((err) => {
				progress.hide();
				console.error('Docs export failed', err);
				new Notice(`Export failed: ${err?.message ?? 'unknown error'}`, 10000);
			});
	}

	onClose() {
		this.contentEl.empty();
	}
}
