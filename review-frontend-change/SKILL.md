---
name: review-frontend-change
description: Use when the user asks for a pre-PR or diff review of frontend API clients, authentication requests, cache or query keys, DTO decoding, normalization, components, copy, localization, responsive layout, accessibility, modals, navigation, or visual evidence. Reviews reachable data-flow and UI regressions using the owning application's actual contracts.
---

# Frontend Change Review

Review only unless the user separately authorizes fixes. Do not post comments or change pull-request state.

## Review flow

1. Establish the base, changed lines, intended user outcome, owning application, and affected routes or states.
2. Read repository instructions and trace imports to the actual client, component, hook, primitive, endpoint, mock, and test definitions.
3. Trace changed data from input and identity through request, decoding, cache, state, rendering, interaction, and error recovery.
4. Compare with the same application's current patterns. Do not transplant another application's similarly named API or component contract.
5. Exclude untouched debt, style preferences, and hypothetical failures. Report only reachable regressions introduced, worsened, or materially touched by the diff with confidence of at least 80/100.
6. Anchor each finding to a changed location and provide mechanism, evidence, smallest safe direction, and exact validation.

Use evidence in this order: changed code and full rendered or data call chain, protecting tests, repository instructions, then other documentation.

## Select references

- Read [references/data-flow.md](references/data-flow.md) when the diff touches clients, auth, cache keys, decoding, pagination, normalization, server/client boundaries, or demo data.
- Read [references/ui-interaction.md](references/ui-interaction.md) when it touches components, copy, localization, accessibility, responsive layout, overlays, navigation, focus, or visual evidence.
- Read both only when the changed behavior crosses both concerns.

## Core decision boundaries

- Use the owning application's real client, auth, error, and component contracts.
- Include every input that changes a result in its cache key, including active account or tenant scope when identity can switch.
- Treat external JSON as untrusted until narrowed or mapped at a deliberate boundary.
- Preserve pagination totals and numbering across empty and later pages.
- Keep demos, previews, and mock applications isolated from production auth, backend, and external state unless explicitly designed otherwise.
- Reuse actual component APIs and shared primitives instead of inventing props from a similarly named component.
- Keep visible copy aligned with the active localization system and check every consumer of shared keys.
- Check semantic controls, accessible names, keyboard and focus behavior, disabled states, touch targets, overflow, loading, empty, error, and recovery states when the diff can affect them.
- Require screenshots or recordings only for material visual or interaction changes, not for copy-only or nonvisual logic.

## Findings

- `P0`: credible authorization, tenant, payment, secret, personal-data, or permanent data-loss path.
- `P1`: user-visible behavior, contract, cache isolation, navigation, or rollout failure.
- `P2`: bounded regression or missing validation with a concrete path.
- Omit style-only suggestions without a reachable changed failure unless requested.

Use `blocked` only when the diff or a critical contract cannot be evaluated.

## Output

```text
Verdict: clean | findings | blocked
Reviewed: [changed surfaces and traced data/rendered path]

Findings:
[P1][confidence 94] Title — changed/path:line
Mechanism: [reachable user failure]
Evidence: [definition, endpoint, test, or contract]
Direction: [smallest safe correction]
Validation: [exact check or visual scenario]

Verified non-findings: [important traps rejected]
Verification needed: [at most two below-threshold items]
```
