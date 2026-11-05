import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type CompAInionPlugin from './main';
import { providerLabel, resolveProvider } from './AiEngine';

export class CompilotSettingsTab extends PluginSettingTab {
	private readonly plugin: CompAInionPlugin;

	constructor(app: App, plugin: CompAInionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'CompAInion - AI Copilot' });

		this.renderProviderSection();
		this.renderGeminiSection();
		this.renderPollinationsSection();
		this.renderOpencodeSection();
		this.renderRulesSection();
		this.renderContextSection();
		this.renderViewSection();
		this.renderHistorySection();
	}

	private renderProviderSection(): void {
		const provider = resolveProvider(this.plugin.settings);
		new Setting(this.containerEl)
			.setName('Active AI provider')
			.setDesc(
				'Automatic: the local opencode toggle wins, then a Gemini API key switches to Gemini, otherwise the keyless Pollinations API is used. ' +
					providerLabel(provider),
			)
			.addText((text) => {
				text.setValue(providerLabel(provider)).setDisabled(true);
				text.inputEl.id = 'compainion-provider-indicator';
				return text;
			});
	}

	private renderGeminiSection(): void {
		new Setting(this.containerEl)
			.setName('Gemini API key')
			.setDesc(
				'Optional. Treated as a secret input, but the key is stored in plain text inside .obsidian/plugins/CompAInion/data.json - this is NOT an encrypted secret store. ' +
					'Get a key at https://aistudio.google.com/apikey.',
			)
			.addText((text) => {
				text.inputEl.type = 'password';
				text.inputEl.classList.add('compainion-key-input');
				text.setPlaceholder('paste your Gemini API key (optional)')
					.setValue(this.plugin.settings.geminiApiKey)
					.onChange(async (value) => {
						this.plugin.settings.geminiApiKey = value.trim();
						await this.plugin.saveSettings();
					});
			})
			.addExtraButton((button) =>
				button
					.setIcon('eye')
					.setTooltip('Show or hide the key')
					.onClick(() => {
						const input = this.containerEl.querySelector<HTMLInputElement>('.compainion-key-input');
						if (input) {
							input.type = input.type === 'password' ? 'text' : 'password';
						}
					}),
			)
			.addExtraButton((button) =>
				button
					.setIcon('eraser')
					.setTooltip('Clear the API key')
					.onClick(async () => {
						this.plugin.settings.geminiApiKey = '';
						await this.plugin.saveSettings();
						new Notice('Gemini API key cleared. CompAInion will use the keyless Pollinations provider.');
						this.display();
					}),
			);

		new Setting(this.containerEl)
			.setName('Gemini model')
			.setDesc('Model id for the Gemini provider, for example gemini-3.8-flash, gemini-3-flash-preview or gemini-2.5-flash. Checked against the Gemini API on first use.')
			.addText((text) =>
				text
					.setPlaceholder('gemini-3.8-flash')
					.setValue(this.plugin.settings.geminiModel)
					.onChange(async (value) => {
						const candidate = value.trim();
						this.plugin.settings.geminiModel = candidate.length ? candidate : 'gemini-3.8-flash';
						await this.plugin.saveSettings();
					}),
			);
	}

	private renderPollinationsSection(): void {
		new Setting(this.containerEl)
			.setName('Pollinations model')
			.setDesc('Model id for the keyless Pollinations lane. The anonymous tier currently serves openai-fast (GPT-OSS 20B). Best effort: the provider can change limits or models at any time.')
			.addText((text) =>
				text
					.setPlaceholder('openai-fast')
					.setValue(this.plugin.settings.pollinationsModel)
					.onChange(async (value) => {
						const candidate = value.trim();
						this.plugin.settings.pollinationsModel = candidate.length ? candidate : 'openai-fast';
						await this.plugin.saveSettings();
					}),
			);
	}

	private renderOpencodeSection(): void {
		new Setting(this.containerEl)
			.setName('Connect to the local opencode server')
			.setDesc(
				'Route all AI traffic to the opencode server on this machine instead of cloud providers. Start it in a terminal with "opencode serve" (default port 4096). Free models like glm-5.3-flash-free work with your existing opencode logins. This toggle takes precedence over Gemini and Pollinations. Desktop only.',
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.useLocalOpencode).onChange(async (value) => {
					this.plugin.settings.useLocalOpencode = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(this.containerEl)
			.setName('opencode server URL')
			.setDesc('Base URL of the local opencode server. The default matches "opencode serve" without flags.')
			.addText((text) =>
				text
					.setPlaceholder('http://127.0.0.1:4096')
					.setValue(this.plugin.settings.opencodeUrl)
					.onChange(async (value) => {
						const candidate = value.trim();
						this.plugin.settings.opencodeUrl = candidate.length ? candidate : 'http://127.0.0.1:4096';
						await this.plugin.saveSettings();
					}),
			);

		new Setting(this.containerEl)
			.setName('opencode provider id')
			.setDesc('Provider id from your opencode configuration; shown as providerID in requests. Leave as opencode for the built-in free models.')
			.addText((text) =>
				text
					.setPlaceholder('opencode')
					.setValue(this.plugin.settings.opencodeProviderId)
					.onChange(async (value) => {
						const candidate = value.trim();
						this.plugin.settings.opencodeProviderId = candidate.length ? candidate : 'opencode';
						await this.plugin.saveSettings();
					}),
			);

		new Setting(this.containerEl)
			.setName('opencode model')
			.setDesc('Model id of your local opencode provider, for example glm-5.3-flash-free.')
			.addText((text) =>
				text
					.setPlaceholder('glm-5.3-flash-free')
					.setValue(this.plugin.settings.opencodeModelId)
					.onChange(async (value) => {
						const candidate = value.trim();
						this.plugin.settings.opencodeModelId = candidate.length ? candidate : 'glm-5.3-flash-free';
						await this.plugin.saveSettings();
					}),
			);

		new Setting(this.containerEl)
			.setName('opencode password')
			.setDesc('Only needed when the server runs with OPENCODE_SERVER_PASSWORD (basic auth, username "opencode"). Stored in plain text in the plugin data.json.')
			.addText((text) => {
				text.inputEl.type = 'password';
				text.inputEl.classList.add('compainion-opencode-password');
				text.setPlaceholder('empty when no server password is set')
					.setValue(this.plugin.settings.opencodePassword)
					.onChange(async (value) => {
						this.plugin.settings.opencodePassword = value;
						await this.plugin.saveSettings();
					});
			})
			.addExtraButton((button) =>
				button
					.setIcon('eye')
					.setTooltip('Show or hide the password')
					.onClick(() => {
						const input = this.containerEl.querySelector<HTMLInputElement>('.compainion-opencode-password');
						if (input) {
							input.type = input.type === 'password' ? 'text' : 'password';
						}
					}),
			);
	}

	private renderRulesSection(): void {
		new Setting(this.containerEl)
			.setName('Rules note path')
			.setDesc(
				'Vault-relative path of a note whose contents are added to the assistant instructions on every message. ' +
					'Created with default rules when missing; edit the note to shape the AI behavior.',
			)
			.addText((text) =>
				text
					.setPlaceholder('CompAInion Rules.md')
					.setValue(this.plugin.settings.rulesNotePath)
					.onChange(async (value) => {
						this.plugin.settings.rulesNotePath = value;
						await this.plugin.saveSettings();
					}),
			);
	}

	private renderContextSection(): void {
		new Setting(this.containerEl)
			.setName('Note context limit')
			.setDesc('Maximum characters of note content sent to the AI per request. Larger notes are truncated with a visible notice.')
			.addSlider((slider) =>
				slider
					.setLimits(1000, 50000, 500)
					.setValue(this.plugin.settings.contextLimitChars)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.contextLimitChars = value;
						await this.plugin.saveSettings();
					}),
			)
			.addText((text) =>
				text
					.setPlaceholder(String(this.plugin.settings.contextLimitChars))
					.setValue(String(this.plugin.settings.contextLimitChars))
					.onChange(async (value) => {
						const parsed = Number.parseInt(value, 10);
						if (Number.isFinite(parsed) && parsed >= 200) {
							this.plugin.settings.contextLimitChars = Math.min(parsed, 200_000);
							await this.plugin.saveSettings();
						}
					}),
			);
	}

	private renderViewSection(): void {
		new Setting(this.containerEl)
			.setName('Open the sidebar automatically')
			.setDesc('Open the CompAInion sidebar the first time the plugin loads. Afterwards the ribbon icon or commands toggle it.')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.autoOpen).onChange(async (value) => {
					this.plugin.settings.autoOpen = value;
					await this.plugin.saveSettings();
				}),
			);
	}

	private renderHistorySection(): void {
		new Setting(this.containerEl)
			.setName('Chat history')
			.setDesc(`The last ${this.plugin.settings.maxHistoryMessages} messages are saved with the vault. Stored messages right now: ${this.plugin.historyMessages().length}.`)
			.addButton((button) =>
				button
					.setButtonText('Clear history')
					.setWarning()
					.onClick(async () => {
						await this.plugin.clearChatHistory();
						this.display();
					}),
			);
	}
}
