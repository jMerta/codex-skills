---
name: write-ui-copy
description: Use when the user asks to draft, rewrite, translate, or review user-facing interface copy in Polish or English, including titles, descriptions, buttons, links, labels, hints, toasts, errors, empty states, statuses, payment messages, and confirmations. Keeps Polish and English meaning aligned when both locales exist.
---

# Write UI Copy

Write for a busy, non-technical person who wants to complete one task without learning the implementation. Follow the product's established terminology and interaction patterns; do not turn transactional interface text into marketing copy.

Support Polish and English only. Use the requested language. When the owning product ships both locales, update and review both together; do not introduce a new locale or translation requirement on your own.

## Workflow

1. Identify who sees the text, what happened, and the one next action that matters.
2. Verify the real product behavior, available actions, consequences, and recovery paths before promising them in copy.
3. Inspect every state and entry point that reuses the message: initial, loading, success, error, empty, disabled, skipped, and closed.
4. Read repository terminology, localization instructions, existing nearby copy, and every consumer of shared text before introducing words.
5. Remove unnecessary text before rewriting. Prefer one clear title, one short supporting block when needed, and explicit actions.
6. Draft in everyday language, active voice, and sentence case.
7. Read [references/polish-copy.md](references/polish-copy.md) for Polish, [references/english-copy.md](references/english-copy.md) for English, and both when both locales ship.
8. Check the copy against the component rules below and read it aloud.
9. Rewrite text that sounds like documentation, a system log, advertising, or empty reassurance. Preserve required financial, contractual, and legal meaning; flag ambiguity instead of guessing.
10. When changing code, keep all existing locale keys aligned and update focused tests for visible text or translation contracts.

## Core rules

- Put the task or outcome first and keep one idea per sentence.
- Prefer short, concrete verbs. Add an object when the verb alone is ambiguous.
- Write from the user's perspective; avoid implementation language.
- Reuse product terms established by the repository instead of inventing synonyms.
- Do not repeat the same message in a title, description, badge, and button.
- Keep a calm, helpful tone. Do not blame the user, joke about failures, or add empty reassurance.
- Make shared copy work in every consumer. Do not mention a modal, step, or page when the same message appears elsewhere.
- Do not claim an action succeeded, a deadline applies, data is safe, or recovery is available unless the product behavior supports it.
- Do not explain around a confusing interaction. Identify the interaction risk when clearer structure or behavior would remove the need for instructional copy.
- Keep Polish and English equivalent in meaning, consequence, and available recovery action; do not translate word for word when natural phrasing differs.

## Component rules

### Dialogs

- Use a title that describes the state or decision.
- Explain a consequence or optional path only when it is not already obvious.
- If a record is already saved, never imply that closing the dialog cancels it.
- Use the local equivalent of “Skip” for an optional follow-up and “Cancel” only while the current operation can still be cancelled.
- Distinguish a short confirmation or utility dialog from a screen-like editor. Do not add a secondary cancel or close action when the owning shell already provides the intended exit.

### Buttons and links

- Describe the action the control performs.
- Keep one visually primary action.
- Add a secondary action only when it represents a distinct, useful path, and describe its consequence accurately.
- Make link text understandable outside the surrounding paragraph.
- Make destructive actions explicit in text; never rely on colour alone to communicate risk.

### Success messages

- Confirm the result, not the interface action.
- Add the next step only when it helps.
- Prefer the actual outcome over generic labels such as “Success” or “Done”.

### Errors

- Say what failed and what the user can do next.
- Keep recovery specific and available in every context where the message appears.
- Avoid technical codes, blame, humor, and generic errors when a concrete message is possible.
- Match field errors to the language used in the field label. Keep inline and summary versions equivalent and understandable out of context.
- Distinguish missing, too short, too long, out-of-range, and wrong-format input when the user can act on that difference.

### Empty and loading states

- State what is missing and, only when useful, how to add or find it.
- Use a short running-action label while an operation is active.
- Never explain implementation details through loading copy.
- When a disabled action needs explanation, state the unmet condition next to it instead of making the button label carry the explanation.

## Review output

Return the current text inventory, one recommended final set, at most two alternatives only when they represent a real trade-off, a short reason for material changes, and any grammar, accessibility, context, or reuse risk. Use a compact table for multiple related strings.
