import { Notice, Plugin } from 'obsidian';
import { AiEngine } from './AiEngine';
import { CopilotView, VIEW_TYPE_COPILOT } from './CopilotView';
import { ensureRulesNote } from './RulesNote';
import { CompilotSettingsTab } from './SettingsTab';
import { ChatMessage, CopilotData, CopilotSettings, DEFAULT_SETTINGS } from './types';
import { VaultManager } from './VaultManager';

const PLUGIN_ID = 'compainion';

export default class CompAInionPlugin extends Plugin {
	settings: CopilotSettings = { ...DEFAULT_SETTINGS };
	private history: ChatMessage[] = [];
	private vaultManager!: VaultManager;
	private engine!: AiEngine;
	private view: CopilotView | null = null;
	private savingData: Promise<void> = Promise.resolve();

	async onload(): Promise<void> {
		await this.loadState();
		this.vaultManager = new VaultManager(this.app);
		this.engine = new AiEngine(this.app, this.vaultManager, () => this.settings);

		this.registerView(VIEW_TYPE_COPILOT, (leaf) => {
			this.view = new CopilotView(leaf, this, this.vaultManager, this.engine);
			return this.view;
		});
		this.addSettingTab(new CompilotSettingsTab(this.app, this));

		this.addRibbonIcon('bot', 'CompAInion - open or close the AI Copilot sidebar', () => {
			void this.toggleView();
		});
		this.addCommand({
			id: 'open-compainion',
			name: 'Open CompAInion (AI Copilot)',
			callback: () => {
				void this.activateView();
			},
		});
		this.addCommand({
			id: 'toggle-compainion',
			name: 'Toggle the CompAInion sidebar',
			callback: () => {
				void this.toggleView();
			},
		});
		this.addCommand({
			id: 'clear-compainion-history',
			name: 'Clear the CompAInion chat history',
			callback: () => {
				void this.clearChatHistory();
			},
		});

		this.app.workspace.onLayoutReady(this.onLayoutReady);
	}

	onunload(): void {
		void this.app.workspace.detachLeavesOfType(VIEW_TYPE_COPILOT);
	}

	private readonly onLayoutReady = (): void => {
		void ensureRulesNote(this.app, this.settings.rulesNotePath).catch((error) => {
			console.error('CompAInion: could not create the rules note.', error);
		});
		if (this.settings.autoOpen && !this.settings.firstRunDone) {
			this.settings.firstRunDone = true;
			void this.activateView().then(() => this.saveSettings());
		}
	};

	// ------------------------------------------------------------------ view helpers

	/** Open (or reveal) the single Copilot sidebar leaf on the right side. */
	async activateView(): Promise<void> {
		const { workspace } = this.app;
		const existing = workspace.getLeavesOfType(VIEW_TYPE_COPILOT);
		if (existing.length > 0) {
			workspace.revealLeaf(existing[0]);
			return;
		}
		const leaf = workspace.getRightLeaf(false);
		if (!leaf) {
			new Notice('Could not open the CompAInion sidebar. Try the command palette entry instead.');
			return;
		}
		// setViewState also registers the copied view, so keep exactly one instance alive.
		await leaf.setViewState({ type: VIEW_TYPE_COPILOT, active: true });
		workspace.revealLeaf(leaf);
	}

	async toggleView(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_COPILOT);
		if (existing.length > 0) {
			await this.app.workspace.detachLeavesOfType(VIEW_TYPE_COPILOT);
			return;
		}
		await this.activateView();
	}

	/** Open the Obsidian settings window on the CompAInion tab. */
	async openSettings(): Promise<void> {
		type SettingsUI = { open(): void; openTabById(tabId: string): void };
		const settingUi = (this.app as unknown as { setting?: SettingsUI }).setting;
		if (!settingUi) {
			new Notice('CompAInion settings are available under Settings > CompAInion.');
			return;
		}
		settingUi.open();
		try {
			settingUi.openTabById(PLUGIN_ID);
		} catch {
			// The settings window shows the plugin list; no further action needed.
		}
	}

	// ------------------------------------------------------------------ state

	private async loadState(): Promise<void> {
		try {
			const data = (await this.loadData()) as Partial<CopilotData> | null;
			this.settings = { ...DEFAULT_SETTINGS, ...(data?.settings ?? {}) };
			this.normalizeSettings();
			this.history = Array.isArray(data?.history) ? data.history.filter(isChatMessage) : [];
		} catch (error) {
			console.error('CompAInion: could not load saved data, starting fresh.', error);
			this.settings = { ...DEFAULT_SETTINGS };
			this.history = [];
		}
	}

	/** Guard numbers/ranges against corrupted data; missing user values keep defaults. */
	private normalizeSettings(): void {
		const s = this.settings;
		s.geminiApiKey = typeof s.geminiApiKey === 'string' ? s.geminiApiKey : '';
		s.geminiModel = typeof s.geminiModel === 'string' && s.geminiModel.trim().length ? s.geminiModel.trim() : DEFAULT_SETTINGS.geminiModel;
		s.pollinationsModel = typeof s.pollinationsModel === 'string' && s.pollinationsModel.trim().length ? s.pollinationsModel.trim() : DEFAULT_SETTINGS.pollinationsModel;
		s.useLocalOpencode = s.useLocalOpencode === true;
		s.opencodeUrl = typeof s.opencodeUrl === 'string' && s.opencodeUrl.trim().length ? s.opencodeUrl.trim() : DEFAULT_SETTINGS.opencodeUrl;
		s.opencodeProviderId = typeof s.opencodeProviderId === 'string' && s.opencodeProviderId.trim().length ? s.opencodeProviderId.trim() : DEFAULT_SETTINGS.opencodeProviderId;
		s.opencodeModelId = typeof s.opencodeModelId === 'string' && s.opencodeModelId.trim().length ? s.opencodeModelId.trim() : DEFAULT_SETTINGS.opencodeModelId;
		s.opencodePassword = typeof s.opencodePassword === 'string' ? s.opencodePassword : '';
	s.rulesNotePath = typeof s.rulesNotePath === 'string' && s.rulesNotePath.trim().length
		? s.rulesNotePath.trim()
		: DEFAULT_SETTINGS.rulesNotePath;
		if (!Number.isFinite(s.contextLimitChars)) {
			s.contextLimitChars = DEFAULT_SETTINGS.contextLimitChars;
		} else {
			s.contextLimitChars = Math.max(200, Math.min(Math.round(s.contextLimitChars), 200_000));
		}
		if (!Number.isFinite(s.conversationContextChars)) {
			s.conversationContextChars = DEFAULT_SETTINGS.conversationContextChars;
		} else {
			s.conversationContextChars = Math.max(500, Math.min(Math.round(s.conversationContextChars), 120_000));
		}
		if (!Number.isFinite(s.maxHistoryMessages) || s.maxHistoryMessages < 10) {
			s.maxHistoryMessages = DEFAULT_SETTINGS.maxHistoryMessages;
		}
		s.autoOpen = s.autoOpen === true;
		s.firstRunDone = s.firstRunDone === true;
	}

	async saveSettings(): Promise<void> {
		this.normalizeSettings();
		void ensureRulesNote(this.app, this.settings.rulesNotePath).catch((error) => {
			console.error('CompAInion: could not create the rules note.', error);
		});
		this.refreshView();
		await this.queueSave();
	}

	/** Current transcript for the view (already capped at load time). */
	historyMessages(): ChatMessage[] {
		return this.history;
	}

	async saveChatHistory(history: ChatMessage[]): Promise<void> {
		this.history = [...history].slice(-this.settings.maxHistoryMessages);
		this.queueSave();
	}

	async clearChatHistory(): Promise<void> {
		this.history = [];
		await this.queueSave();
		this.refreshView();
		new Notice('CompAInion chat history cleared.');
	}

	private refreshView(): void {
		this.view?.refreshProviderChip();
		this.view?.syncWithPluginHistory();
	}

	private queueSave(): Promise<void> {
		// serialize saveData writes
		this.savingData = this.savingData.then(async () => {
			try {
				await this.saveData({ settings: this.settings, history: this.history } satisfies CopilotData);
			} catch (error) {
				console.error('CompAInion: could not save plugin data.', error);
			}
		});
		return this.savingData;
	}
}

function isChatMessage(candidate: unknown): candidate is ChatMessage {
	if (!candidate || typeof candidate !== 'object') {
		return false;
	}
	const record = candidate as Partial<ChatMessage>;
	return typeof record.id === 'string'
		&& (record.role === 'user' || record.role === 'assistant')
		&& typeof record.text === 'string'
		&& typeof record.ts === 'number'
		&& typeof record.status === 'string';
}
