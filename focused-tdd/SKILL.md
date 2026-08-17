---
name: focused-tdd
description: Use when the user asks for test-first development, TDD, or a regression test before a fix, or when implementing deterministic business rules, state transitions, authorization boundaries, idempotency, and other behavior where observing a focused failing test would materially reduce risk. Selects strict TDD, regression-first, or proportional validation.
---

# Focused TDD

Treat test-first development as a risk-reduction technique, not a universal ceremony.

## Choose the workflow

Inspect the changed behavior, nearby code, existing tests, and repository instructions. State the selected approach briefly before editing.

Use **strict RED-GREEN-REFACTOR** only when all apply:

- The change has an observable behavioral contract.
- A deterministic automated test can exercise the owning layer.
- The focused test is expected to run quickly enough for repeated feedback.
- Watching the test fail would materially increase confidence in the implementation.

Use **regression-first** for a confirmed bug when one focused test can reproduce its failure mechanism.

Use **proportional validation** for exploratory, behavior-preserving, generated, documentation-only, configuration-heavy, primarily visual, or externally dependent work. Add tests after implementation only when they protect meaningful behavior.

Do not:

- create a test for every function, branch, or implementation detail;
- build a new test harness whose cost exceeds the changed risk;
- rewrite existing user code merely because it predates a test;
- manufacture a RED step when the behavior already exists;
- claim TDD when the new test was never observed failing for the intended reason.

## Run a focused cycle

### RED

1. Write one minimal test for one independently observable behavior.
2. Prefer real domain or application code. Mock only slow, nondeterministic, or external boundaries.
3. Run the narrowest command that exercises the test.
4. Confirm an assertion fails because the behavior is missing. Fix setup or fixture failures until the signal is meaningful.
5. If the test passes, determine whether the behavior already exists. Adjust the scenario or stop; do not force a failure.

### GREEN

1. Implement the smallest coherent change that satisfies the contract.
2. Run the same focused test.
3. Fix production code when the contract is correct; change the test only when the asserted contract was wrong.

### REFACTOR

Refactor only when it improves the changed design enough to justify another cycle. Keep the focused test green and do not expand scope under the label of cleanup.

Repeat once per observable behavior, not once per method or file.

## Keep validation proportional

- Run the focused test during the loop; run broader checks once after behavior stabilizes.
- Stop strict cycling after two environment or harness failures unrelated to the behavior. Continue with the best proportional validation and report the blocker.
- Test rules at their owning layer: transport mapping at the boundary, business rules in domain/application code, persistence contracts against the real adapter or database when needed, and user interaction in frontend tests.
- Add negative authorization, tenant, idempotency, concurrency, or transition cases only when the changed risk requires them.
- Follow repository-specific commands and verification guidance instead of inventing a parallel test workflow.

## Report evidence

```text
Approach: strict TDD | regression-first | proportional validation
RED: [test and expected failure, or why RED was not valuable]
GREEN: [focused passing command]
Broader validation: [commands and results]
Remaining gap: [only a material unverified risk]
```
