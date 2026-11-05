/** Identifier of one AI provider. */
export type ProviderId = 'pollinations' | 'gemini' | 'opencode';

/** Vault operation kind a model may request. */
export type VaultAction = 'create' | 'update' | 'delete' | 'read' | 'search';

/** One vault operation as requested by a model. */
export interface VaultOperation {
	action: VaultAction;
	/**
	 * Vault-relative path of the target Markdown file. For search operations
	 * the path mirrors the query text so the field stays present throughout.
	 */
	path: string;
	/** Required for create and update operations. */
	content?: string;
	/** Required for search operations: the topic or name fragment to locate. */
	query?: string;
}

/** Normalized response contract shared by every provider adapter. */
export interface AIResponse {
	chat_reply: string;
	/** Optional: one current intent line shown in the status line between request rounds. */
	status_note?: string;
	operations: VaultOperation[];
}

/** One vault attachment captured in the chat, passed to image-capable providers. */
export interface AttachmentPayload {
	/** File name as saved into the vault (cleaned). */
	filename: string;
	/** Image mime type, always image/*. */
	mimeType: string;
	/** Raw image bytes. */
	data: ArrayBuffer;
}

/** Outcome of a single executed (or rejected) vault operation. */
export interface OperationResult {
	ok: boolean;
	action: VaultAction;
	path: string;
	/** Operation result detail shown to the user. */
	message: string;
	/** Underlying cause when the operation failed. */
	error?: string;
	/** For successful read operations: the file content. */
	content?: string;
	/** For successful search operations: the matched note paths. */
	matched?: string[];
	/** Steps taken on the vault (folder created, moved to trash, ...). */
	steps?: string[];
}

/** Author of a chat message. */
export type ChatRole = 'user' | 'assistant';

/** Display lifecycle of a chat message. */
export type ChatStatus = 'loading' | 'done' | 'error';

/** One persisted chat message. */
export interface ChatMessage {
	id: string;
	role: ChatRole;
	text: string;
	ts: number;
	status: ChatStatus;
	/** Assistant messages: execution outcome of requested operations. */
	ops?: OperationResult[];
	/** Assistant messages: delete operations awaiting explicit user confirmation. */
	pendingDeletes?: VaultOperation[];
	/** Assistant messages: notes about rejected/malformed operations. */
	warnings?: string[];
	/** Assistant messages: provider that produced the answer. */
	provider?: ProviderId;
	/** Assistant messages: marks an errored turn that can be retried. */
	failed?: boolean;
}

/** Persisted plugin data (settings + chat transcript + bookkeeping). */
export interface CopilotData {
	settings: CopilotSettings;
	history: ChatMessage[];
}

export interface CopilotSettings {
	/** Google Gemini API key. Empty = use the keyless Pollinations provider. */
	geminiApiKey: string;
	/** Gemini model id. */
	geminiModel: string;
	/** Pollinations text model id (anonymous lane). */
	pollinationsModel: string;
	/** Route AI requests to the local opencode server instead of cloud providers. */
	useLocalOpencode: boolean;
	/** Base URL of the local opencode server (default port of `opencode serve`). */
	opencodeUrl: string;
	/** Provider id inside the opencode configuration. */
	opencodeProviderId: string;
	/** Model id inside the opencode provider. */
	opencodeModelId: string;
	/** Optional basic-auth password when the server runs with OPENCODE_SERVER_PASSWORD. */
	opencodePassword: string;
	/** Vault-relative path of the user rules note injected into the assistant instructions. */
	rulesNotePath: string;
	/** Maximum characters of note content sent as context in a request. */
	contextLimitChars: number;
	/** Soft cap of characters for conversation context built per request. */
	conversationContextChars: number;
	/** Maximum persisted chat messages. */
	maxHistoryMessages: number;
	/** Automatically open the sidebar on first plugin activation. */
	autoOpen: boolean;
	/** True when the sidebar has been auto-opened once. */
	firstRunDone: boolean;
}

export const DEFAULT_SETTINGS: CopilotSettings = {
	geminiApiKey: '',
	geminiModel: 'gemini-3.8-flash',
	pollinationsModel: 'openai-fast',
	useLocalOpencode: false,
	opencodeUrl: 'http://127.0.0.1:4096',
	opencodeProviderId: 'opencode',
	opencodeModelId: 'glm-5.3-flash-free',
	opencodePassword: '',
	rulesNotePath: 'CompAInion Rules.md',
	contextLimitChars: 8000,
	conversationContextChars: 24000,
	maxHistoryMessages: 100,
	autoOpen: true,
	firstRunDone: false,
};
