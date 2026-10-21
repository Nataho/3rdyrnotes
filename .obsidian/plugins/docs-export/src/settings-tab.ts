import { App, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';
import type DocsExportPlugin from './main';
import {
	allMarkdownFiles,
	countIncluded,
	deselectEntry,
	entryState,
	selectEntry,
} from './selection';
import { DEFAULT_LAST_EXPORT_PATH } from './settings';

export class DocsExportSettingTab extends PluginSettingTab {
	plugin: DocsExportPlugin;
	private expandedFolders = new Set<string>();

	constructor(app: App, plugin: DocsExportPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('Site').setHeading();

		new Setting(containerEl)
			.setName('Site name')
			.setDesc('Shown in the navbar, browser tab and footer of the exported site.')
			.addText((text) =>
				text
					.setPlaceholder('Docs')
					.setValue(this.plugin.settings.siteName)
					.onChange(async (value) => {
						this.plugin.settings.siteName = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Content width (px)')
			.setDesc('Maximum width of the reading column, like Docusaurus’ document column.')
			.addText((text) =>
				text
					.setValue(String(this.plugin.settings.contentWidth))
					.onChange(async (value) => {
						const n = parseInt(value, 10);
						if (!isNaN(n) && n >= 400 && n <= 1600) {
							this.plugin.settings.contentWidth = n;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl).setName('Page elements').setHeading();

		new Setting(containerEl)
			.setName('Breadcrumbs')
			.setDesc('Site › Folder › Page path above the page title.')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.showBreadcrumbs).onChange(async (v) => {
					this.plugin.settings.showBreadcrumbs = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('“Last updated” date')
			.setDesc('Shows when the note was last modified.')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.showLastUpdated).onChange(async (v) => {
					this.plugin.settings.showLastUpdated = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Previous / next navigation')
			.setDesc('Footer links to the previous and next page, like Docusaurus.')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.showPagination).onChange(async (v) => {
					this.plugin.settings.showPagination = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Mermaid diagrams via CDN')
			.setDesc('Render ```mermaid blocks using mermaid.js from a CDN (internet needed when viewing the export).')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.enableMermaid).onChange(async (v) => {
					this.plugin.settings.enableMermaid = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl).setName('Export destination').setHeading();

		new Setting(containerEl)
			.setName('Remember export folder')
			.setDesc('Pre-fill the destination folder next time (the dialog still asks for confirmation on every export).')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.rememberPath).onChange(async (v) => {
					this.plugin.settings.rememberPath = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Last export folder')
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_LAST_EXPORT_PATH)
					.setValue(this.plugin.settings.lastExportPath)
					.onChange(async (value) => {
						this.plugin.settings.lastExportPath = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl).setName('Selection').setHeading();

		const selectionSetting = new Setting(containerEl)
			.setName('Files and folders')
			.setDesc('Choose which notes end up in the export. Referenced images and attachments are always included.');
		selectionSetting.addButton((btn) =>
			btn.setButtonText('Select all').onClick(async () => {
				this.plugin.settings.include = [];
				this.plugin.settings.exclude = ['.trash'];
				await this.plugin.saveSettings();
				this.display();
			}),
		);
		selectionSetting.addButton((btn) =>
			btn.setButtonText('Clear').onClick(async () => {
				const tops = new Set<string>();
				for (const f of allMarkdownFiles(this.app)) tops.add(f.path.split('/')[0]);
				this.plugin.settings.include = [];
				this.plugin.settings.exclude = Array.from(tops);
				await this.plugin.saveSettings();
				this.display();
			}),
		);

		const counter = containerEl.createEl('p', { cls: 'docs-export-selection-counter' });
		this.updateCounter(counter);

		const treeEl = containerEl.createEl('div', { cls: 'docs-export-tree' });
		this.renderFolder(treeEl, this.app.vault.getRoot(), 0, counter);
	}

	private updateCounter(counter: HTMLElement) {
		const n = countIncluded(this.plugin.settings, allMarkdownFiles(this.app));
		counter.textContent = `${n} note${n === 1 ? '' : 's'} selected for export`;
	}

	private folderHasNotes(folder: TFolder): boolean {
		for (const child of folder.children) {
			if (child instanceof TFile && child.extension === 'md') return true;
			if (child instanceof TFolder && !child.name.startsWith('.') && this.folderHasNotes(child)) return true;
		}
		return false;
	}

	private renderFolder(parentEl: HTMLElement, folder: TFolder, depth: number, counter: HTMLElement) {
		for (const child of folder.children) {
			if (child instanceof TFolder) {
				if (child.name.startsWith('.') || !this.folderHasNotes(child)) continue;
				const isOpen = this.expandedFolders.has(child.path);
				const row = parentEl.createEl('div', { cls: 'docs-export-row' });
				row.style.paddingLeft = `${depth * 18}px`;
				row.dataset.path = child.path;
				row.dataset.folder = '1';
				const toggle = row.createEl('button', { cls: `docs-export-toggle${isOpen ? ' is-open' : ''}` });
				const chevron = toggle.createEl('span', { cls: 'docs-export-chevron' });
				chevron.innerHTML = SVG_CHEVRON;
				const childrenEl = parentEl.createEl('div', { cls: `docs-export-children${isOpen ? '' : ' is-collapsed'}` });
				this.attachCheckbox(row, child.path, true, counter);
				row.createEl('span', { cls: 'docs-export-label', text: child.name });
				toggle.addEventListener('click', (e) => {
					e.preventDefault();
					this.expandedFolders.has(child.path)
						? this.expandedFolders.delete(child.path)
						: this.expandedFolders.add(child.path);
					const open = this.expandedFolders.has(child.path);
					childrenEl.classList.toggle('is-collapsed', !open);
					toggle.classList.toggle('is-open', open);
				});
				this.renderFolder(childrenEl, child, depth + 1, counter);
			} else if (child instanceof TFile && child.extension === 'md') {
				const row = parentEl.createEl('div', { cls: 'docs-export-row' });
				row.style.paddingLeft = `${depth * 18 + 22}px`;
				row.dataset.path = child.path;
				this.attachCheckbox(row, child.path, false, counter);
				row.createEl('span', { cls: 'docs-export-label', text: child.name });
			}
		}
	}

	private attachCheckbox(row: HTMLElement, path: string, isFolder: boolean, counter: HTMLElement) {
		const input = row.createEl('input', { type: 'checkbox' });
		input.addClass('docs-export-checkbox');
		const state = entryState(this.plugin.settings, path, isFolder);
		input.checked = state === 'on';
		input.indeterminate = state === 'partial';
		input.addEventListener('change', () => {
			if (input.checked) selectEntry(this.plugin.settings, path);
			else deselectEntry(this.plugin.settings, path);
			this.plugin.saveSettings();
			this.refreshCheckboxes(counter);
		});
	}

	private refreshCheckboxes(counter: HTMLElement) {
		this.containerEl.querySelectorAll<HTMLElement>('.docs-export-row').forEach((row) => {
			const path = row.dataset.path;
			if (!path) return;
			const cb = row.querySelector<HTMLInputElement>('input.docs-export-checkbox');
			if (!cb) return;
			const state = entryState(this.plugin.settings, path, row.dataset.folder === '1');
			cb.checked = state === 'on';
			cb.indeterminate = state === 'partial';
		});
		this.updateCounter(counter);
	}
}

const SVG_CHEVRON = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
