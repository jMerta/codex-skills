# Polish interface copy

Load this reference only for Polish text.

## Natural Polish

- Prefer direct, everyday verbs and sentence case.
- Avoid bureaucratic passive forms such as `nastąpiło`, `dokonano`, or `zostało wykonane` when the outcome can be named directly.
- Avoid filler such as `proszę`, `uwaga`, `pomyślnie`, and `już teraz` unless it changes meaning.
- Keep transactional, financial, booking, and legal text calm and unambiguous.
- Do not translate English noun stacks literally; name the action or object naturally.

## Dynamic values

- Do not place an uninflected personal or product name after a preposition that requires declension.
- Restructure the sentence so the dynamic name begins it, or use a label such as `Klient: {name}`.
- Check grammatical number for dynamic counts and avoid a fixed noun form when the runtime does not provide plural rules.
- Keep placeholders identical across Polish and English locale keys unless the localization framework explicitly maps them.

## Controls and states

- Use `Pomiń` for an optional follow-up.
- Use `Anuluj` only when the current operation can still be cancelled.
- Prefer result-first success text, for example `Link skopiowany`, followed by a useful next action only when necessary.
- For errors, name the failed action and available recovery, for example `Nie udało się skopiować linku. Spróbuj ponownie.`

Review every consumer of a shared translation key before referring to a specific page, dialog, or navigation path.
