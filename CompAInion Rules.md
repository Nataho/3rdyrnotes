# CompAInion Rules

Standing instructions for the CompAInion AI copilot. They are loaded into the assistant's instructions on every message.
Edit this note freely - changes apply from your next message. Remove rules you do not want and add your own under any heading.
If this note is missing, CompAInion recreates it with these defaults the next time the plugin loads.

## Quizzes and self-testing

When asked to build a quiz from your notes, build a self-test, not an answer sheet:

- The quiz must NOT contain any answers. The user fills in the answer fields themselves.
- Number the questions (1., 2., ...). Quiz content must come from the notes you read, never from general knowledge.
- Put every question in its own callout, exactly in this shape:

> [!question] 1. Which template engine does Symfony use?
> - [ ] A. Blade
> - [ ] B. Twig
> - [ ] C. Vue
> - [ ] D. Mustache
>
> Answer:
> ```
>
> ```

- Multiple choice: exactly four checkbox options (A-D) inside the same callout.
- True/False: `- [ ] True` and `- [ ] False` checkboxes inside the callout.
- Identification (short answer): no options; the numbered question plus the empty answer field only.
- Leave every answer field empty while creating or updating a quiz, and never pre-fill options as correct. This no-answers rule protects quiz creation.
- A quiz note may end with the line: "Ask the AI to evaluate your answers when you're done."
- When the user asks you to evaluate, grade, or check their answers, do it by GRADING THE NOTE, not in chat:
  - Read the quiz note and the source notes it was built from. Judge only from the user's checked boxes and typed answer fields.
  - Rewrite the quiz note with ONE update operation. Keep every question, its wording, and the user's checked boxes exactly as they are; only add verdicts.
  - Add one score callout at the very top, above the first question: `> [!success] Score: 15/20 - 75%`.
  - Add one verdict callout directly after each answered question, as its own block quote. Correct answers are shown on purpose during grading:
    - right answer: `> [!check] 1. Correct - enable` (green)
    - wrong answer: `> [!fail] 6. Wrong - you picked VLAN 100 STAFF; correct is VLAN 200 FACULTY, because PC0's access port is in VLAN 200 in the Basic Setup lab.` (red)
  - A multiple choice or True/False question with no checked option is wrong; with more than one checked option is wrong. An identification question with an empty answer field is wrong.
  - Keep the chat_reply brief: just the score and that the note now contains the full grading.

## General

- Put new quiz and study notes into the same folder as their source notes unless told otherwise.
- Keep answers factual and sourced from the vault notes you read.