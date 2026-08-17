---
name: review-backend-change
description: Use when the user asks for a pre-PR or diff review of backend controllers, APIs, domain services, authorization, tenant context, jobs, transactions, repositories, SQL, ORM or mapper code, schema migrations, constraints, indexes, or backfills. Reviews reachable domain, persistence, and rollout regressions across the full call chain.
---

# Backend Change Review

Review only unless the user separately authorizes fixes. Do not post comments, change pull-request state, or mutate databases or environments.

## Review flow

1. Establish the base, diff, intended behavior, runtime stack, and changed backend surfaces.
2. Read repository instructions for every changed path.
3. Trace each changed path through transport, application or domain logic, persistence, schema, asynchronous work, and protecting tests as applicable.
4. Compare with the nearest current pattern in the same repository and stack.
5. Exclude untouched debt, style preferences, and hypothetical failures. A prohibited flow is in scope only when the diff materially changes it.
6. Report only reachable failures with confidence of at least 80/100, anchored to a changed file or line with mechanism, evidence, smallest safe direction, and exact validation.

Use evidence in this order: changed code and complete call chain, behavior-protecting tests, repository instructions, then other documentation.

## Select references

- Read [references/domain-api.md](references/domain-api.md) when the diff touches controllers, commands, domain rules, authorization, request context, transactions, errors, jobs, retries, or pagination.
- Read [references/persistence-migrations.md](references/persistence-migrations.md) when it touches repositories, adapters, SQL, ORM or mapper configuration, migrations, constraints, indexes, or backfills.
- Read both only when the changed flow crosses both boundaries.

## Core decision boundaries

- Keep transport validation at the inbound edge and canonical business rules at the layer shared by every caller.
- Enforce authorization and tenant ownership through every read and write. UI hiding and caller-supplied IDs are not authority.
- Carry scope explicitly through background work; do not depend on request-local context.
- Place coordinated write transactions at the reusable application or use-case boundary.
- Preserve stable error and pagination contracts unless the change includes a compatible migration.
- Parameterize ordinary SQL values. Raw SQL substitution is safe only after a closed mapping to fixed literals.
- Require migrations to be uniquely ordered, immutable after application, compatible with rolling deploys, and deterministic for existing data.
- Check list/count symmetry, null and empty behavior, retry and idempotency semantics, concurrency, and wrong-owner cases when the diff can affect them.

## Findings

- `P0`: credible authorization, tenant, payment, secret, personal-data, or permanent data-loss path.
- `P1`: user- or operations-visible behavior, contract, integrity, or rollout failure.
- `P2`: bounded regression or missing validation with a concrete path.
- Omit suggestions without a reachable changed failure unless requested.

Use `blocked` only when the diff or a critical contract cannot be evaluated.

## Output

```text
Verdict: clean | findings | blocked
Reviewed: [changed surfaces and traced call chain]

Findings:
[P1][confidence 94] Title — changed/path:line
Mechanism: [reachable failure]
Evidence: [code, test, schema, or contract]
Direction: [smallest safe correction]
Validation: [exact test or check]

Verified non-findings: [important traps rejected]
Verification needed: [at most two below-threshold items]
```
