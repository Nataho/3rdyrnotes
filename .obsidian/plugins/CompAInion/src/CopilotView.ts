import { ItemView, MarkdownRenderer, Notice, Platform, setIcon, WorkspaceLeaf } from 'obsidian';
import type CompAInionPlugin from './main';
import { ActiveNoteContext, AiEngine, providerLabel, resolveProvider, TurnStatus } from './AiEngine';
import {
	approveImages,
	imageFilesFromClipboard,
	imageFilesFromDrop,
	saveAttachmentToVault,
} from './Attachments';
import { linkifyNotePaths } from './NoteLinkifier';
import { AttachmentPayload, ChatMessage, OperationResult, VaultOperation } from './types';
import { VaultManager } from './VaultManager';

export const VIEW_TYPE_COPILOT = 'compainion-view';

const EMPTY_HINT =
	'Ask anything about your notes. You can ask me to find, create, update, read, or move notes to the vault trash.';
const PERSIST_DEBOUNCE_MS = 600;
const CONFIRM_RESET_MS = 3500;

export class CopilotView extends ItemView {
	private readonly plugin: CompAInionPlugin;
	private readonly engine: AiEngine;
	private readonly vaultManager: VaultManager;

	private messages: ChatMessage[];
	private busy = false;
	private persistTimer: number | null = null;
	private newChatTimer: number | null = null;
	private newChatArmed = false;
	private messageEls = new Map<string, HTMLElement>();
	private pendingAttachments: { payload: AttachmentPayload; embedText: string }[] = [];

	private messagesEl: HTMLElement | null = null;
	private statusEl: HTMLElement | null = null;
	private providerChipEl: HTMLElement | null = null;
	private textareaEl: HTMLTextAreaElement | null = null;
	private sendButtonEl: HTMLButtonElement | null = null;
	private newChatButtonEl: HTMLButtonElement | null = null;
	private placeholderEl: HTMLElement | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: CompAInionPlugin, vaultManager: VaultManager, engine: AiEngine) {
		super(leaf);
		this.plugin = plugin;
		this.vaultManager = vaultManager;
		this.engine = engine;
		this.messages = plugin.historyMessages();
		this.navigation = false;
	}

	getViewType(): string {
		return VIEW_TYPE_COPILOT;
	}

	getDisplayText(): string {
		return 'CompAInion - AI Copilot';
	}

	getIcon(): string {
		return 'bot';
	}

	// ------------------------------------------------------------------ lifecycle

	async onOpen(): Promise<void> {
		const root = this.contentEl;
		root.empty();
		root.addClass('compainion-view');

		this.renderHeader(root);

		const chat = root.createDiv({ cls: 'compainion-chat' });
		this.messagesEl = chat.createDiv({ cls: 'compainion-messages' });
		this.renderFooter(chat);

		this.renderAllMessages();
		this.refreshProviderChip();
		this.autoScroll(true);
		this.setDisabled(false);
		if (!Platform.isMobile) {
			this.textareaEl?.focus();
		}
	}

	async onClose(): Promise<void> {
		this.flushPersist();
		if (this.newChatTimer !== null) {
			window.clearTimeout(this.newChatTimer);
			this.newChatTimer = null;
		}
		if (this.persistTimer !== null) {
			window.clearTimeout(this.persistTimer);
			this.persistTimer = null;
		}
		this.messageEls.clear();
		this.messagesEl = null;
		this.contentEl.empty();
	}

	// ------------------------------------------------------------------ header

	private renderHeader(root: HTMLElement): void {
		const header = root.createDiv({ cls: 'compainion-header' });
		const titlePart = header.createDiv({ cls: 'compainion-header-title' });
		titlePart.createSpan({ text: 'CompAInion' });
		this.providerChipEl = titlePart.createSpan({ cls: 'compainion-provider' });

		const actions = header.createDiv({ cls: 'compainion-header-actions' });
		this.newChatButtonEl = actions.createEl('button', {
			cls: 'clickable-icon compainion-header-button',
			attr: { 'aria-label': 'New conversation: clear the chat and its saved history' },
		});
		this.newChatButtonEl.createSpan({ text: 'New chat' });
		this.newChatButtonEl.addEventListener('click', () => this.onNewChat());

		const settingsButton = actions.createEl('button', {
			cls: 'clickable-icon compainion-header-button',
			attr: { 'aria-label': 'Open CompAInion settings' },
		});
		settingsButton.createSpan({ text: 'Settings' });
		settingsButton.addEventListener('click', () => {
			void this.plugin.openSettings();
		});
	}

	/** Two-step clear so a misclick cannot wipe the transcript. */
	private onNewChat(): void {
		if (this.busy) {
			new Notice('CompAInion is still working on the previous message.');
			return;
		}
		if (!this.messages.length) {
			new Notice('The conversation is already empty.');
			return;
		}
		if (!this.newChatArmed) {
			this.newChatArmed = true;
			this.newChatButtonEl?.addClass('compainion-confirm-armed');
			if (this.newChatButtonEl) {
				this.newChatButtonEl.setText('Confirm clear?');
			}
			this.newChatTimer = window.setTimeout(() => {
				this.newChatArmed = false;
				this.newChatTimer = null;
				this.newChatButtonEl?.removeClass('compainion-confirm-armed');
				this.newChatButtonEl?.setText('New chat');
			}, CONFIRM_RESET_MS);
			return;
		}
		if (this.newChatTimer !== null) {
			window.clearTimeout(this.newChatTimer);
			this.newChatTimer = null;
		}
		this.newChatArmed = false;
		this.newChatButtonEl?.removeClass('compainion-confirm-armed');
		this.newChatButtonEl?.setText('New chat');
		void this.clearConversation();
	}

	private async clearConversation(): Promise<void> {
		await this.plugin.clearChatHistory();
		this.messages = [];
		this.messageEls.clear();
		if (this.messagesEl) {
			this.messagesEl.empty();
			this.renderEmptyState();
		}
	}

	private renderEmptyState(): void {
		if (!this.messagesEl) {
			return;
		}
		this.placeholderEl = this.messagesEl.createDiv({ cls: 'compainion-placeholder' });
		this.placeholderEl.createSpan({ text: EMPTY_HINT });
	}

	refreshProviderChip(): void {
		if (!this.providerChipEl) {
			return;
		}
		const provider = resolveProvider(this.plugin.settings);
		this.providerChipEl.setText(providerLabel(provider));
		this.providerChipEl.setAttribute('aria-label', `Current AI provider: ${providerLabel(provider)}`);
	}

	/** Reload messages from plugin storage (used when history is cleared from settings). */
	syncWithPluginHistory(): void {
		if (this.busy) {
			return; // do not disturb an in-flight turn; it persists its own state afterwards
		}
		this.messages = this.plugin.historyMessages();
		this.messageEls.clear();
		this.renderAllMessages();
		this.autoScroll(true);
	}

	// ------------------------------------------------------------------ footer

	private renderFooter(root: HTMLElement): void {
		this.statusEl = root.createDiv({ cls: 'compainion-status', attr: { hidden: 'hidden' } });
		this.statusEl.createSpan({ cls: 'compainion-status-spinner' });
		this.statusEl.createSpan({ cls: 'compainion-status-text' });

		const privacyEl = root.createDiv({ cls: 'compainion-privacy', attr: { 'aria-label': 'Privacy notice' } });
		privacyEl.createSpan({
			text: 'When a request references the active note, its content is sent to the selected external AI provider.',
		});

		const inputRow = root.createDiv({ cls: 'compainion-input-row' });
		this.textareaEl = inputRow.createEl('textarea', {
			cls: 'compainion-input',
			attr: {
				placeholder: 'Ask about your notes... (Enter to send, Shift+Enter for a new line)',
				rows: '1',
			},
		});
		this.textareaEl.addEventListener('keydown', (event: KeyboardEvent) => {
			if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
				event.preventDefault();
				void this.onSend();
			}
		});
		this.textareaEl.addEventListener('input', () => this.autoResizeTextarea());
		this.textareaEl.addEventListener('paste', (event: ClipboardEvent) => {
			const incoming = imageFilesFromClipboard(event);
			if (incoming.length === 0) {
				return;
			}
			event.preventDefault();
			void this.ingestAttachments(incoming);
		});
		this.textareaEl.addEventListener('dragover', (event: DragEvent) => {
			if (imageFilesFromDrop(event).length > 0 || (event.dataTransfer?.types?.includes('Files') ?? false)) {
				event.preventDefault();
			}
		});
		this.textareaEl.addEventListener('drop', (event: DragEvent) => {
			const incoming = imageFilesFromDrop(event);
			if (incoming.length === 0) {
				return;
			}
			event.preventDefault();
			void this.ingestAttachments(incoming);
		});

		this.sendButtonEl = inputRow.createEl('button', { cls: 'mod-cta compainion-send', attr: { 'aria-label': 'Send message' } });
		setIcon(this.sendButtonEl, 'send');
		this.sendButtonEl.addEventListener('click', () => {
			void this.onSend();
		});
	}

	private autoResizeTextarea(): void {
		const textarea = this.textareaEl;
		if (!textarea) {
			return;
		}
		textarea.style.height = 'auto';
		textarea.style.height = `${Math.max(24, Math.min(textarea.scrollHeight, 140))}px`;
	}

	private setDisabled(disabled: boolean): void {
		if (this.textareaEl) {
			this.textareaEl.disabled = disabled;
		}
		if (this.sendButtonEl) {
			this.sendButtonEl.disabled = disabled;
		}
	}

	// ------------------------------------------------------------------ attachments

	/** Save pasted/dropped images into the vault and insert their embed text at the cursor. */
	private async ingestAttachments(files: File[]): Promise<void> {
		const verdict = approveImages(files);
		for (const file of verdict.oversized) {
			new Notice(`"${file.name}" is larger than 20 MB and was not attached.`, 7000);
		}
		if (verdict.overflow.length > 0) {
			new Notice(`At most 4 images per paste; ${verdict.overflow.length} further image(s) were ignored.`, 7000);
		}
		for (const file of verdict.approved) {
			try {
				const data = await file.arrayBuffer();
				const saved = await saveAttachmentToVault(this.app, file.name, file.type || 'image/png', data);
				const embedText = `![[${saved.path}]]`;
				const payload: AttachmentPayload = {
					filename: saved.name,
					mimeType: /^image\//i.test(file.type) ? file.type : 'image/png',
					data,
				};
				this.pendingAttachments.push({ payload, embedText });
				this.insertTextAtCursor(embedText);
				new Notice(`Attachment saved: ${saved.path}`, 4000);
			} catch (error) {
				console.error('CompAInion: could not save a pasted attachment.', error);
				new Notice(`Could not save the pasted attachment: ${error instanceof Error ? error.message : 'unknown error'}`, 7000);
			}
		}
	}

	/** Attach only those queued images whose embed text is still present in the prompt. */
	private collectAttachments(promptText: string): AttachmentPayload[] {
		const picked: AttachmentPayload[] = [];
		const usedEmbeds = new Set<string>();
		const kept: { payload: AttachmentPayload; embedText: string }[] = [];
		for (const entry of this.pendingAttachments) {
			if (promptText.includes(entry.embedText) && !usedEmbeds.has(entry.embedText)) {
				usedEmbeds.add(entry.embedText);
				picked.push(entry.payload);
			} else if (!usedEmbeds.has(entry.embedText)) {
				kept.push(entry);
			}
		}
		this.pendingAttachments = kept;
		return picked;
	}

	/** Insert text at the current caret position without stealing focus. */
	private insertTextAtCursor(text: string): void {
		const textarea = this.textareaEl;
		if (!textarea) {
			return;
		}
		const start = textarea.selectionStart ?? textarea.value.length;
		const end = textarea.selectionEnd ?? start;
		const before = textarea.value.slice(0, start);
		const after = textarea.value.slice(end);
		const leadingSpace = before.length > 0 && !/\s$/.test(before) ? ' ' : '';
		const inserted = `${leadingSpace}${text}`;
		textarea.value = `${before}${inserted}${after}`;
		const caret = (before + inserted).length;
		textarea.setSelectionRange(caret, caret);
		this.autoResizeTextarea();
	}

	// ------------------------------------------------------------------ status line

	private showStatus(text: string): void {
		if (!this.statusEl) {
			return;
		}
		this.statusEl.removeAttribute('hidden');
		const label = this.statusEl.querySelector<HTMLElement>('.compainion-status-text');
		if (label) {
			label.setText(text);
		}
	}

	private clearStatus(): void {
		if (!this.statusEl) {
			return;
		}
		this.statusEl.setAttribute('hidden', 'hidden');
		const label = this.statusEl.querySelector<HTMLElement>('.compainion-status-text');
		if (label) {
			label.setText('');
		}
	}

	private statusTextFor(status: TurnStatus, providerName: string, detail?: string): string {
		const current = detail?.trim();
		if (current?.length) {
			return current;
		}
		switch (status) {
			case 'thinking':
				return `Waiting for the AI response (${providerName})...`;
			case 'searching':
				return 'Searching the vault for matching notes...';
			case 'reading':
				return 'Reading notes from the vault...';
			case 'finalizing':
				return 'Preparing the final response...';
			default:
				return 'Working...';
		}
	}

	// ------------------------------------------------------------------ message rendering

	private renderAllMessages(): void {
		if (!this.messagesEl) {
			return;
		}
		this.messagesEl.empty();
		this.messageEls.clear();
		if (!this.messages.length) {
			this.renderEmptyState();
			return;
		}
		for (const message of this.messages) {
			this.renderMessage(message);
		}
	}

	private renderMessage(message: ChatMessage): void {
		if (!this.messagesEl) {
			return;
		}
		if (this.placeholderEl) {
			this.placeholderEl.remove();
			this.placeholderEl = null;
		}
		const container = this.messagesEl.createDiv({
			cls: [
				'compainion-message',
				message.role === 'user' ? 'compainion-user' : 'compainion-assistant',
				message.status === 'error' ? 'compainion-error' : '',
			].filter(Boolean).join(' '),
		});
		this.messageEls.set(message.id, container);
		this.populateMessageContainer(container, message);
	}

	/** Rebuild one message card in place so DOM order and references stay stable. */
	private rerenderMessage(message: ChatMessage): void {
		const container = this.messageEls.get(message.id);
		if (!container) {
			this.renderMessage(message);
			return;
		}
		if (message.status !== 'error') {
			container.removeClass('compainion-error');
		} else {
			container.addClass('compainion-error');
		}
		this.populateMessageContainer(container, message);
	}

	private populateMessageContainer(container: HTMLElement, message: ChatMessage): void {
		container.empty();

		const meta = container.createDiv({ cls: 'compainion-message-meta' });
		meta.createSpan({ text: new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
		if (message.role === 'user') {
			const removeButton = meta.createSpan({
				cls: 'compainion-message-remove',
				attr: { 'aria-label': 'Remove this message from the transcript' },
			});
			removeButton.setText('\u2715');
			removeButton.addEventListener('click', () => this.removeMessage(message));
		}

		const bubble = container.createDiv({ cls: `compainion-message-bubble compainion-bubble-${message.role}` });
		this.renderBubbleContent(message, bubble);

		if (message.ops && message.ops.length > 0) {
			const opsBlock = container.createDiv({ cls: 'compainion-ops' });
			for (const result of message.ops) {
				this.renderOpPill(opsBlock, result);
			}
		}

		if (message.pendingDeletes && message.pendingDeletes.length > 0) {
			const confirmBlock = container.createDiv({ cls: 'compainion-pending-deletes' });
			for (const deleteOp of message.pendingDeletes) {
				this.renderDeleteCard(confirmBlock, message, deleteOp);
			}
		}

		if (message.warnings && message.warnings.length > 0) {
			const warningsBlock = container.createDiv({ cls: 'compainion-warnings' });
			for (const warning of message.warnings) {
				warningsBlock.createDiv({ text: warning, cls: 'compainion-warning' });
			}
		}
	}

	private renderBubbleContent(message: ChatMessage, bubble: HTMLElement): void {
		bubble.empty();
		switch (message.status) {
			case 'loading':
				bubble.createSpan({ cls: 'compainion-loading-dots', attr: { 'aria-label': 'Waiting for the AI response' } });
				return;
			case 'error':
				bubble.createSpan({ cls: 'compainion-error-text' }).createSpan({
					text: message.text.trim().length > 0 ? message.text : 'An unknown error occurred. You can retry.',
				});
				if (message.failed) {
					const retryButton = bubble.createEl('button', { cls: 'compainion-retry' });
					retryButton.createSpan({ text: 'Retry' });
					retryButton.setAttribute('aria-label', 'Re-send the last user message');
					retryButton.addEventListener('click', () => {
						void this.retryLastUserMessage();
					});
				}
				return;
			default:
				break;
		}
		if (message.role === 'user') {
			const span = bubble.createSpan({ cls: 'compainion-user-text' });
			span.createSpan({ text: message.text });
			return;
		}
		void this.renderAssistantMarkdown(message, bubble);
	}

	private async renderAssistantMarkdown(message: ChatMessage, bubble: HTMLElement): Promise<void> {
		const srcPath = this.app.workspace.getActiveFile()?.path ?? '';
		const temp = createDiv();
		try {
			await MarkdownRenderer.renderMarkdown(message.text || '(no content)', temp, srcPath, this);
			while (temp.firstChild) {
				bubble.appendChild(temp.firstChild);
			}
			linkifyNotePaths(bubble, this.app);
			bubble.addClass('compainion-assistant-text');
		} catch (error) {
			const span = bubble.createSpan({ text: message.text });
			linkifyNotePaths(span, this.app);
			console.error('CompAInion: markdown rendering failed.', error);
		} finally {
			temp.remove();
		}
	}

	private renderOpPill(block: HTMLElement, result: OperationResult): void {
		const pill = block.createDiv({ cls: `compainion-op ${result.ok ? 'compainion-op-ok' : 'compainion-op-fail'}` });
		const label = pill.createSpan({
			text: `${result.ok ? 'OK' : 'Failed'} - ${result.action} - ${result.message}${result.error ? ` (${result.error})` : ''}`,
		});
		linkifyNotePaths(label, this.app);
		if (result.ok && result.matched && result.matched.length > 0) {
			const list = block.createDiv({ cls: 'compainion-search-matches' });
			for (const matchPath of result.matched) {
				this.renderMatchLink(list, matchPath);
			}
		}
	}

	/** One found note as a clickable line that opens the note in the editor. */
	private renderMatchLink(list: HTMLElement, matchPath: string): void {
		const link = list.createDiv({ cls: 'compainion-match' }).createEl('button', {
			cls: 'compainion-match-link',
			attr: { 'aria-label': `Open ${matchPath}` },
		});
		const icon = link.createSpan({ cls: 'compainion-match-icon' });
		setIcon(icon, 'file-text');
		link.createSpan({ cls: 'compainion-match-path', text: matchPath });
		link.addEventListener('click', () => {
			void this.app.workspace.openLinkText(matchPath, '', false);
		});
	}

	private renderDeleteCard(block: HTMLElement, message: ChatMessage, deleteOp: VaultOperation): void {
		const card = block.createDiv({ cls: 'compainion-delete-card' });
		const pathLabel = card.createSpan({ cls: 'compainion-delete-path', text: deleteOp.path });
		linkifyNotePaths(pathLabel, this.app);
		const confirmButton = card.createEl('button', { cls: 'mod-warning compainion-delete-confirm', text: 'Confirm' });
		confirmButton.setAttribute('aria-label', `Confirm moving ${deleteOp.path} to the vault trash`);
		confirmButton.addEventListener('click', () => {
			void this.executePendingDelete(message, deleteOp);
		});
		const cancelButton = card.createEl('button', { cls: 'compainion-delete-cancel', text: 'Cancel' });
		cancelButton.setAttribute('aria-label', `Cancel moving ${deleteOp.path} to the vault trash`);
		cancelButton.addEventListener('click', () => {
			this.cancelPendingDelete(message, deleteOp);
		});
	}

	private autoScroll(force: boolean): void {
		if (!this.messagesEl) {
			return;
		}
		if (force) {
			this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
			return;
		}
		const nearBottom = this.messagesEl.scrollHeight - this.messagesEl.scrollTop - this.messagesEl.clientHeight < 120;
		if (nearBottom) {
			this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
		}
	}

	// ------------------------------------------------------------------ send, messages, transient state

	private async onSend(): Promise<void> {
		const prompt = (this.textareaEl?.value ?? '').trim();
		if (!prompt.length) {
			return;
		}
		if (this.busy) {
			new Notice('CompAInion is still working on the previous message.');
			return;
		}
		const attachments = this.collectAttachments(prompt);
		if (this.textareaEl) {
			this.textareaEl.value = '';
		}
		this.autoResizeTextarea();
		await this.performTurn(prompt, attachments);
	}

	/** Re-send the most recent user prompt (Retry button). */
	private async retryLastUserMessage(): Promise<void> {
		if (this.busy) {
			new Notice('CompAInion is already working.');
			return;
		}
		for (let i = this.messages.length - 1; i >= 0; i -= 1) {
			if (this.messages[i].role === 'user') {
				await this.performTurn(this.messages[i].text);
				return;
			}
		}
		new Notice('No earlier message to retry.');
	}

	private appendUserMessage(text: string): ChatMessage {
		const message: ChatMessage = { id: newMessageId(), role: 'user', text, ts: Date.now(), status: 'done' };
		this.messages.push(message);
		this.renderMessage(message);
		return message;
	}

	private appendAssistantPlaceholder(): ChatMessage {
		const message: ChatMessage = { id: newMessageId(), role: 'assistant', text: '', ts: Date.now(), status: 'loading' };
		this.messages.push(message);
		this.renderMessage(message);
		return message;
	}

	private async performTurn(prompt: string, attachments: AttachmentPayload[] = []): Promise<void> {
		if (this.busy) {
			return;
		}
		this.busy = true;
		this.setDisabled(true);
		const providerName = providerLabel(resolveProvider(this.plugin.settings));

		const historySnapshot = this.messages.slice(); // context for the model, before this turn
		this.appendUserMessage(prompt);
		const assistantMessage = this.appendAssistantPlaceholder();
		this.autoScroll(true);
		this.showStatus(this.statusTextFor('thinking', providerName));
		this.schedulePersist();

		try {
			const activeNote: ActiveNoteContext | null = await this.engine.prepareActiveNote(prompt);
			const result = await this.engine.runTurn({
				userPrompt: prompt,
				history: historySnapshot,
				activeNote,
				attachments,
				callbacks: {
					onStatus: (status, detail) => this.showStatus(this.statusTextFor(status, providerName, detail)),
				},
			});
			assistantMessage.text = result.replyText;
			assistantMessage.ops = [...result.readResults, ...result.opsResults];
			assistantMessage.warnings = result.warnings;
			assistantMessage.provider = result.providerUsed;
			assistantMessage.pendingDeletes = result.pendingDeletes.map((op) => ({ ...op }));
			assistantMessage.status = 'done';
			if (result.pendingDeletes.length > 0) {
				new Notice('The AI wants to move note(s) to the vault trash. Confirm each deletion card in the chat.', 9000);
			}
		} catch (error) {
			console.error('CompAInion: the AI turn failed.', error);
			assistantMessage.status = 'error';
			assistantMessage.failed = true;
			assistantMessage.provider = resolveProvider(this.plugin.settings).provider;
			const rawMessage = error instanceof Error ? error.message : '';
			assistantMessage.text = rawMessage.trim().length > 0
				? rawMessage
				: 'An unknown error occurred while the AI was processing the request. No operations were executed. You can retry.';
		} finally {
			this.busy = false;
			this.setDisabled(false);
			this.pendingAttachments = [];
			this.clearStatus();
			this.refreshProviderChip();
			this.schedulePersist();
			this.rerenderMessage(assistantMessage);
			this.autoScroll(false);
			if (!Platform.isMobile) {
				this.textareaEl?.focus();
			}
		}
	}

	// ------------------------------------------------------------------ delete confirmations

	/** Remove one chat message from the transcript (user convenience, not a vault operation). */
	private removeMessage(message: ChatMessage): void {
		if (this.busy) {
			new Notice('CompAInion is busy, please try again in a moment.');
			return;
		}
		this.messages = this.messages.filter((entry) => entry.id !== message.id);
		const container = this.messageEls.get(message.id);
		container?.remove();
		this.messageEls.delete(message.id);
		if (!this.messages.length) {
			this.renderEmptyState();
		}
		this.schedulePersist();
	}

	/** Execute one confirmed delete: validate, trash the note, record the result on the message. */
	private async executePendingDelete(message: ChatMessage, deleteOp: VaultOperation): Promise<void> {
		const pending = message.pendingDeletes ?? [];
		const index = pending.findIndex((op) => op.path === deleteOp.path);
		if (index === -1) {
			return;
		}
		const result = await this.vaultManager.executeOperation(deleteOp);
		message.pendingDeletes = pending.filter((_, i) => i !== index);
		message.ops = [...(message.ops ?? []), result];
		this.rerenderMessage(message);
		this.autoScroll(false);
		this.schedulePersist();
	}

	private cancelPendingDelete(message: ChatMessage, deleteOp: VaultOperation): void {
		const pending = message.pendingDeletes ?? [];
		message.pendingDeletes = pending.filter((op) => op.path !== deleteOp.path);
		message.ops = [
			...(message.ops ?? []),
			{ ok: false, action: 'delete', path: deleteOp.path, message: 'Delete cancelled by the user. The note was not moved to the trash.' },
		];
		this.rerenderMessage(message);
		this.schedulePersist();
	}

	// ------------------------------------------------------------------ persistence

	private schedulePersist(): void {
		if (this.persistTimer !== null) {
			window.clearTimeout(this.persistTimer);
		}
		this.persistTimer = window.setTimeout(() => {
			this.persistTimer = null;
			void this.plugin.saveChatHistory(this.messages);
		}, PERSIST_DEBOUNCE_MS);
	}

	private flushPersist(): void {
		if (this.persistTimer !== null) {
			window.clearTimeout(this.persistTimer);
			this.persistTimer = null;
		}
		void this.plugin.saveChatHistory(this.messages);
	}
}

function newMessageId(): string {
	return `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
