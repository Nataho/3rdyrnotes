# Plan: Ship compiled main.js so Linux clones can enable the plugin

## Root cause (verified, read-only)
- `.obsidian/plugins/CompAInion/.gitignore:2` ignores `main.js` (default esbuild-scaffold rule).
- `git ls-files` shows the repo has no `main.js`; `git check-ignore -v` confirms the rule.
- Effect: on any clone/pull (the Linux user) Obsidian lists CompAInion (manifest.json present) but enabling fails - there is nothing to import. Windows works only because main.js exists uncommitted on disk from local builds.
- Code itself is fine: `minAppVersion 1.4.0` safely low, `es2020` target, nothing Linux-specific.

## Approved decision
User chose: "Commit main.js + push (Recommended)".

## Steps
1. Edit `.obsidian/plugins/CompAInion/.gitignore` - delete the `main.js` line; keep `node_modules/` and `.DS_Store`.
2. `git add .obsidian/plugins/CompAInion/main.js`; commit with short lowercase message, e.g. `ship compiled main.js so clones can enable the plugin` (repo style).
3. `git push origin main` (branch is 5 local commits ahead incl. today's merge; will be 6).
4. Tell the Linux user to: `git pull` -> restart Obsidian -> enable CompAInion.

## Verification (on Windows side)
- `git ls-files .obsidian/plugins/CompAInion` now lists `main.js`.
- `git check-ignore -v .obsidian/plugins/CompAInion/main.js` returns nothing.
- Push succeeds and origin/main advances.

## Notes
- Ongoing: after every future plugin source change, commit the rebuilt `main.js` too.
- Runtime (not enable) caveat: the pulled `data.json` points to the Windows machine's opencode server (127.0.0.1:4096). On Linux: run own `opencode serve` or toggle off local opencode in settings -> keyless Pollinations fallback.
