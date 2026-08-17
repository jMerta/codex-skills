# Frontend UI and interaction patterns

## Use the actual primitive contract

Trace imports to definitions and inspect a nearby shipped caller. Do not infer props or event names from a similarly named component in another application or library.

Validate with the owning application's type check and the closest component or interaction test.

## Keep localization at the app boundary

Inspect the active localization framework, locale files, key generator, and every consumer of a shared key. Keep changed keys aligned across supported locales. Do not impose localization on a surface that deliberately uses inline copy.

Flag only copy changed by the diff or materially reused by it; untouched hardcoded text is separate debt.

## Check interaction and accessibility

Inspect:

- semantic element and accessible name;
- keyboard activation, tab order, focus entry and restoration, and escape behavior;
- disabled, loading, empty, error, and recovery states;
- touch target, overflow, safe-area spacing, sticky actions, and scroll containment;
- screen-reader status or error announcement when behavior changes.

Use the nearest shared primitive unless the intended outcome requires a different interaction.

## Select visual evidence by materiality

Require representative post-change screenshots or a short recording when the diff materially changes layout, responsive structure, navigation, modal or sheet behavior, sticky actions, focus, animation, or visual direction.

Do not demand screenshots for copy-only changes, nonvisual logic, isolated accessible-name fixes, or equivalent composition of an unchanged primitive. Use focused render, interaction, accessibility, lint, and type checks instead.

When evidence is needed, compare the same data, viewport, theme, and zoom. State when a real before state is unavailable rather than reconstructing one after the fix.
