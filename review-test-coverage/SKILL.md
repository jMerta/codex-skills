---
name: review-test-coverage
description: Use when the user asks for a pre-PR or diff review of tests, CI evidence, test harness changes, screenshots, recordings, or proportional validation. Finds reachable behavior that the changed tests or evidence fail to protect, separates code defects from external CI outages, and recommends the narrowest meaningful check.
---

# Test Coverage Review

Review only unless the user separately authorizes fixes. Do not rerun external CI, post comments, or change pull-request state.

## Review contract

1. Establish the base, changed behavior, affected surfaces, and validation performed after the last edit.
2. Read repository instructions and trace each changed branch to its owning layer and nearest existing test pattern.
3. Identify the observable failure the change can cause and the narrowest test or check that would detect it.
4. Exclude untouched coverage debt, duplicate tests at every layer, style preferences, and speculation without a reachable changed failure.
5. Report only findings with confidence of at least 80/100, anchored to a changed location with the missing behavior, evidence, smallest test direction, and exact validation command.
6. Keep code verdict, validation gaps, and external CI availability separate.

Read [references/validation-patterns.md](references/validation-patterns.md) when the diff touches authorization or ownership, state transitions, persistence or migrations, async retries, UI interaction, CI or harness setup, infrastructure, or operational scripts.

## Select validation by ownership

- Test canonical business rules at the domain or application owner.
- Test transport validation, authorization annotations, request-context wiring, and error mapping at the boundary.
- Use a real database or service integration test when mapping, SQL, constraint, migration, or protocol behavior is the risk.
- Cover failure, retry, duplicate or idempotency, and allowed or forbidden transitions only where those branches changed.
- Use the closest frontend render or interaction test, then type, lint, or build checks according to blast radius.
- Require browser or media evidence only for material visual or interaction behavior.
- Render infrastructure and exercise success plus failure or rollback paths when deployment behavior changes.

Run the narrowest relevant check first. Broaden only when the changed blast radius requires it.

## Interpret evidence

- Validation must occur after the final relevant edit.
- A test-harness-only change is not a production regression when it restores the intended test signal.
- Checkout, runner, provider, registry, or service failures before repository commands run are external verification gaps, not findings against the diff.
- Portability issues involving line endings, executable bits, interpreters, time zones, locales, or filesystem behavior are findings only when the changed harness has a concrete supported-platform failure.
- Use `blocked` only when the diff or a critical contract cannot be evaluated.

## Priorities and output

Use `P0` for an unprotected credible authorization, tenant, payment, secret, personal-data, or permanent data-loss path; `P1` for user or operational correctness, contract, state, rollout, or integrity; and `P2` for a bounded regression or missing validation with a concrete failure path.

```text
Verdict: clean | findings | blocked
Reviewed: [changed behavior, owning layer, tests, and current evidence]

Findings:
[P1][confidence 94] Title — changed/path:line
Mechanism: [reachable unprotected failure]
Evidence: [changed branch and current test gap]
Direction: [smallest test or check]
Validation: [exact command or visual scenario]

Verified non-findings: [adequate coverage and traps rejected]
Verification needed: [at most two non-finding gaps or external reruns]
```
