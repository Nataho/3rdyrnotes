# CompAInion — AI Copilot for Obsidian

A GitHub-Copilot-Chat-style AI assistant that runs in Obsidian's right sidebar and can actually manage your vault: it creates, updates, reads and moves Markdown notes to the trash through Obsidian's native vault API.

No login. No mandatory API key. No backend. No external database.

## Features

- **Chat sidebar** (`AI Copilot`): right-sidebar view with user/assistant bubbles, markdown-rendered answers, timestamps, operation result pills, loading/status indicators and a privacy notice.
- **Default AI provider: Pollinations** — keyless classic API (`text.pollinations.ai`). Free anonymous tier, roughly one text request per 15-30 seconds per IP. No account needed.
- **Optional Google Gemini** — set an API key and the plugin automatically switches to Gemini (`gemini-3.8-flash` by default, model configurable). Structured output is enforced with `responseSchema`.
- **Optional local opencode provider** — flip one toggle and all AI traffic goes to the opencode server on this machine (`opencode serve`, default `http://127.0.0.1:4096`), using your locally configured models such as the free `opencode/glm-5.3-flash-free`. No cloud request involved beyond your own machine.
- **Live status narration**: every response may carry a short `status_note` ("Reading the four source notes to grade your checked options..."), shown in the status line while you wait, plus concrete progress per executed operation (`Reading "Cisco Quiz.md" (2/4)`).
- **Vault operations requested by the AI, executed by the plugin**:
  - `search` — locates notes by topic or name fragment: matches note paths first and, only when nothing matches, scans note contents (capped). Found notes appear as clickable links that open in the editor.
  - `create` — creates the note, including missing parent folders; never overwrites an existing file.
  - `update` — modifies an existing note only.
  - `delete` — moves the note to the vault trash (`.trash`), **only after you confirm** on a card in the chat.
  - `read` — reads a note so the AI can answer questions about its content (read-then-respond workflow). Read flows may request one extra read round (up to 8 notes), which is what makes flows like "grade my quiz against its source notes" work.
- **Paste and drag-drop attachments**: paste a screenshot (or drop an image file) into the chat input and it is saved into the vault where your Obsidian attachment settings point; `![[path]]` embed text is inserted at the cursor. With the opencode and Gemini providers the actual image data is sent to the AI (up to 4 images per paste, 20 MB per file). The keyless Pollinations lane is text-only: you get a warning pill and the AI sees just the path text.
- **Vault index**: every request includes a live note index (all note names, folder by folder, freshly computed from the vault; very large vaults fall back to a folder overview with note counts). The AI is instructed to use it and `search` instead of asking which notes exist - no extra index file is written into your vault.
- **Path safety**: only vault-relative `.md` paths are accepted. Absolute paths, `..` traversal, hidden/system folders (`.obsidian`, `.trash`, dot-folders), invalid characters and reserved names are rejected.
- **Structured JSON responses**: the model must answer with `{"chat_reply": ..., "operations": [...]}`; malformed JSON is never executed — you get an error and can retry.
- **Active note context**: when a message refers to the current note ("this note", "the active file", ...), its path, name and content are included (truncated at the configured context limit).
- **Persistent chat history**: the latest 100 messages are saved with the vault via the plugin's `data.json` and restored on load.
- **Mobile friendly**: `isDesktopOnly: false`; uses `requestUrl` and standard APIs.

## Installation (you build it yourself)

1. Build the plugin (see below). The build produces `main.js` next to the sources.
2. Keep the folder `CompAInion` inside `.obsidian/plugins/` of your vault (if you moved the project from elsewhere, put the built files in `.obsidian/plugins/CompAInion/`).
3. In Obsidian: **Settings → Community plugins → enable CompAInion**.
4. The sidebar opens automatically on first activation; later use the bot ribbon icon or the command palette (`CompAInion: open / toggle / clear history`).

## Build instructions

```bash
cd .obsidian/plugins/CompAInion
npm install
npm run build        # esbuild -> main.js
npm run typecheck    # tsc --noEmit
```

No runtime dependencies are bundled; `obsidian`, `esbuild` and `typescript` are dev-only. After editing sources, run `npm run build` and reload the plugin in Obsidian.

## Provider configuration

| Setting | Meaning |
|---|---|
| Active AI provider | Automatic: local opencode toggle → Gemini key → Pollinations (keyless). |
| Connect to the local opencode server | Routes all AI traffic to `opencode serve` on this machine. Takes precedence over Gemini and Pollinations. |
| opencode server URL / provider id / model | Defaults: `http://127.0.0.1:4096`, `opencode`, `glm-5.3-flash-free`. |
| opencode password | Only with `OPENCODE_SERVER_PASSWORD` (basic auth). |
| Gemini API key | Optional password field, stored in plain text in the plugin `data.json`. Not an encrypted secret store. |
| Gemini model | e.g. `gemini-3.8-flash`, `gemini-2.5-flash`. Verified against the API on first use. |
| Pollinations model | `openai-fast` (GPT-OSS 20B) — the only model on the keyless anonymous lane. |
| Note context limit | Maximum characters of note content sent per request. Oversized notes are truncated with a visible notice. |
| Open sidebar automatically | Opens the sidebar the first time the plugin loads. |
| Clear chat history | Wipes the saved transcript. |

### Pollinations (default)

- Endpoint: `GET https://text.pollinations.ai/{prompt}?json=true` (long conversations switch to the documented `POST https://text.pollinations.ai/` lane automatically).
- Free, no key, no signup. **Best effort**: rate limited per IP (one text request roughly every 15-30 s); 402/429 responses honour `Retry-After` and are retried once.
- The provider can change limits, models or availability at any time — errors are surfaced in the chat, not hidden.

### Gemini (optional)

- Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` with the `x-goog-api-key` header.
- Structured output via `generationConfig.responseMimeType` + `responseSchema` matching the operation contract.
- A blocked/empty/blocked-prompt response never executes operations.

### opencode (local, optional)

1. In a terminal run `opencode serve` (default `http://127.0.0.1:4096`; pass `--port`/`--hostname` to change).
2. Enable **Connect to the local opencode server** in the CompAInion settings.
3. Every request creates a throwaway opencode session, sends the conversation with tools disabled, reads the text parts, and deletes the session afterwards.
4. The model is addressed as `providerID/modelID`. For the built-in free models keep `opencode` and pick the model id, e.g. `glm-5.3-flash-free`. Set the password field only when the server runs with `OPENCODE_SERVER_PASSWORD`.
5. Localhost means this provider only makes sense on the same desktop (mobile has no server to reach).

## Vault operations and safety

- The AI never touches files directly: it only returns operation requests. The plugin validates each one (path rules above) and executes it through `app.vault`.
- Delete **always** waits for an explicit per-card confirmation (Confirm / Cancel). Files go to the vault trash, never permanent deletion.
- One information round per user request (search/read → follow-up), with caps: max 3 searches, 8 reads, 10 writes, 10 deletes per turn. After a search or a read round the model may request one extra read round on the discovered paths (so flows like "grade my quiz against its source notes" fit in one request). Extra or malformed operations are rejected with a visible warning.
- Replies must name the concrete note paths involved (sources used, notes created/updated); synthesized notes must be based on the read contents, not the model's general knowledge.
- Each executed or rejected operation shows an OK/Failed pill; failure of one op does not stop others.

## Privacy

- When a request references the active note, its content is sent to the **selected external AI provider** (Pollinations or Google). Requests are not processed locally or privately.
- The active note is only included when your wording refers to it. A compact **folder overview** (folder names and note counts, no content) is always included so the AI can locate notes. Note contents are only fetched when the model requests explicit read/search operations.
- A small notice in the UI reminds you of this. Don't paste secrets into notes you ask the assistant to read.

## Known limitations

- Pollinations' anonymous lane is rate-limited and best effort; multi-request flows (read-then-respond) can wait on the free slot.
- The opencode provider requires the local server to be running and is desktop-only (loopback).
- The chat history stores message texts and operation summaries, not full file contents of read operations.
- Empty model answers are never silently ignored: with executed operations you get a plain summary instead, otherwise the turn turns into a retryable error.
- Only `.md` files are managed; attachments and other file types are out of scope.
- Settings are stored in `data.json` inside the plugin folder (including the optional Gemini key in plain text — do not publish that file).
- Gemini "thinking" output is filtered out; only answer text is shown.

## Manifest

| Field | Value |
|---|---|
| id | `compainion` |
| minAppVersion | 1.4.0 |
| isDesktopOnly | false |
