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
- Leave every answer field empty. Never write the correct answer into the field, the callout, or the note.
- Never include an answer key - not in the note, not at the bottom, nowhere.
- Every quiz note must end with a line telling the user to: ask the AI to evaluate answers.
- When the user asks the AI to evaluate their answers: a blank answer field counts as wrong, and a multiple-choice question with 2 or more options checked counts as wrong.

## General

- Put new quiz and study notes into the same folder as their source notes unless told otherwise.
- Keep answers factual and sourced from the vault notes you read.
