# Plan: Fix opencode 401 (generated rotating password) for Linux

## Root cause (verified)
- Plugin auth is correct: `opencodeHeaders` sends `Basic base64(opencode:<password>)` (`AiEngine.ts:1215-1220`), applied to all call sites (:681 session create, :700 message, :725 cleanup DELETE). Upstream `packages/opencode/src/server/auth.ts` (v1.19.4 = dev) confirms Basic-only, username `opencode`.
- Linux chat shows the 401 "auth" error. Screenshot: `opencode serve` prints a generated `server password ...`. Per GitHub PR #46270, some builds force-generate that password EVERY start and enforce Basic - a stale pasted copy yields 401 for every message ("hello" included).
- Repo `data.json` is secret-clean: `geminiApiKey` and `opencodePassword` both EMPTY in git.
- User decision: use the stable documented opt-in - `OPENCODE_SERVER_PASSWORD=<secret> opencode serve` - and paste that same secret into the plugin. No stable-password code needed; auth scheme already matches.

## Steps
1. `src\AiEngine.ts` - `describeOpencodeError` 401 case (line ~1269): new text pointing to the stable env-var password and warning about the rotating printed one:
   `'The local opencode server rejected the request (auth). Start the server with OPENCODE_SERVER_PASSWORD=<secret> opencode serve and set that same secret in the plugin's "opencode password" setting. The password "opencode serve" prints on its own is regenerated on every restart and stops working as soon as the server restarts.'`
2. `src\SettingsTab.ts` - 'opencode password' description (~line 170-176): add the stable-vs-rotating hint (稳定的 env-var invocation; printed password = regenerated each restart).
3. `README.md` - local opencode setup section (lines 75-78): add the fixed-password invocation + the regeneration warning; note the plugin needs its password re-set after a server restart if the printed one is used.
4. Rebuild: `npm run build` + `typecheck` (workdir plugin folder). `main.js` is a shipped repo artifact now - commit it together with the src change.
5. Commit ("explain server password behavior in 401 error + docs") and `git push origin main`.
6. Linux user instructions (no code):
   - `OPENCODE_SERVER_PASSWORD=<their-secret> opencode serve`
   - In plugin settings: paste `<their-secret>` into "opencode password" (URL stays `http://127.0.0.1:4096`, local toggle ON).
   - `git pull` later for the updated `main.js`; reload plugins; "hello" should respond.

## Verification
- Windows: build/typecheck clean; push lands.
- Linux: env-var server + matching plugin password -> "hello" works; restarting `serve` no longer requires re-pasting (fixed secret).
