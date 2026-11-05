# Plan: Grading must be written into the quiz note

## Root cause (evidence)
- The AI DID read the quiz and DID run an update op: `data.json:209` (Read pill), `data.json:244` ("Updated note "ITS 302/Cisco Quiz.md" (3906 characters now)") - but the rewrite only removed a leftover empty `## Answer key` heading; no verdicts were written.
- Cause: the seed rule `RulesNote.ts:44` told the model to "reply with the answer key in the chat" when asked to grade, while the no-answers rule (`RulesNote.ts:43`) forbids writing answers into the note. The model resolved this with chat-only grading + trivia update.
- The user's root rules note had 3 extra rules the AI added in an earlier turn (no answer key, "ask the AI to evaluate" trailer, blank/multi-checked = wrong). All are sensible -> fold into defaults.

## Approved user decisions
1. Verdicts: per-question callout after each question + score callout at the very top.
2. Root `CompAInion Rules.md`: regenerate from the new defaults (overwrite).

## Changes (no engine-logic edits; prompt/rule text only)

### 1) `src\RulesNote.ts` - DEFAULT_RULES_CONTENT (quiz section)
Replace the two bullets at current lines 43-44:
```
	'- Leave every answer field empty. Never write the correct answer into the field, the callout, or the note.',
	'- Only when the user explicitly asks to show, grade, or check answers: read the note first, then reply with the answer key in the chat. Add an `## Answer key` section at the bottom of the note only when the user asks to put it there.',
```
with:
```
	'- Leave every answer field empty while creating or updating a quiz, and never pre-fill options as correct. This no-answers rule protects quiz creation.',
	'- A quiz note may end with the line: "Ask the AI to evaluate your answers when you\'re done."',
	'- When the user asks you to evaluate, grade, or check their answers, do it by GRADING THE NOTE, not in chat:',
	'  - Read the quiz note and the source notes it was built from. Judge only from the user\'s checked boxes and typed answer fields.',
	'  - Rewrite the quiz note with ONE update operation. Keep every question, its wording, and the user\'s checked boxes exactly as they are; only add verdicts.',
	'  - Add one score callout at the very top, above the first question: `> [!success] Score: 15/20 - 75%`.',
	'  - Add one verdict callout directly after each answered question, as its own block quote. Correct answers are shown on purpose during grading:',
	'    - right answer: `> [!check] 1. Correct - enable` (green)',
	'    - wrong answer: `> [!fail] 6. Wrong - you picked VLAN 100 STAFF; correct is VLAN 200 FACULTY, because PC0\'s access port is in VLAN 200 in the Basic Setup lab.` (red)',
	'  - A multiple choice or True/False question with no checked option is wrong; with more than one checked option is wrong. An identification question with an empty answer field is wrong.',
	'  - Keep the chat_reply brief: just the score and that the note now contains the full grading.',
```

### 2) `src\AiEngine.ts` - SYSTEM_PROMPT
After the line `'When no vault operation is necessary, return an empty operations array.',` insert:
```
	'When the user asks you to evaluate, grade, or check answers in a note, deliver the results INTO that note with an update operation (a score callout at the top and one verdict callout after each item); the chat_reply only summarizes the score.',
	'Never claim in chat_reply that a note was graded, created, updated, or deleted unless you returned a matching operation in this same response.',
```

### 3) Build + typecheck
- Workdir `C:\Users\Nataho\Documents\Vaults\School\.obsidian\plugins\CompAInion`
- `npm run build` then `npm run typecheck`

### 4) Regenerate vault-root `CompAInion Rules.md`
Overwrite `C:\Users\Nataho\Documents\Vaults\School\CompAInion Rules.md` (user consented) from the new seed via a node script that reads `src\RulesNote.ts`, extracts the `DEFAULT_RULES_CONTENT` array (eval the join like the previous mk_rules.cjs approach), and writes with an ABSOLUTE path (previous script had an `../../` relative-path bug - do not reuse it).

## Verification (user side)
1. Reload the plugin (Settings - Community plugins - toggle CompAInion off/on).
2. New chat, ask: "evaluate my quiz".
3. Expect: quiz + 4 source reads, ONE `Updated "ITS 302/Cisco Quiz.md"` op, brief chat reply with score, and the note gaining a `[!success] Score` callout at top plus green `[!check]` / red `[!fail]` callouts under each question.

## Notes
- `data.json:186` old warning string is historical chat data, not code; leave as-is.
- README needs no change (nothing contradicted).
