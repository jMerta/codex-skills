---
name: review-architecture-scope
description: Use when the user asks for a pre-PR or diff review of changes crossing application, API contract, runtime, tenant, deployment, infrastructure, observability, or intended-outcome boundaries. Traces producers, consumers, compatibility windows, asynchronous context, rollout paths, and scope without treating diff size as risk.
---

# Architecture and Scope Review

Review only unless the user separately authorizes fixes. Do not post comments or change pull-request state.

## Review contract

1. Establish the base, changed files, intended outcome, and rollout unit. Infer missing scope from the diff and nearby code before asking.
2. Read repository instructions for every changed surface.
3. Trace each changed contract to its producer, actual consumers, runtime and deployment configuration, and nearest tests.
4. Compare behavior before and after. Exclude untouched debt, style preferences, and hypothetical failures.
5. Report only a reachable failure introduced, worsened, or materially touched at a changed location with confidence of at least 80/100.
6. Give mechanism, evidence, smallest safe direction, and exact validation.

Use evidence in this order: changed code and complete call chain, behavior-protecting tests, repository instructions, then other documentation. Report instruction drift separately instead of inventing a diff finding.

## Inspection map

### Contracts and rollout

- Search symbols and wire names to find actual producers and consumers; do not assume every application uses the contract.
- For independently deployed versions, model old producer/new consumer and new producer/old consumer.
- Add fields before requiring them, tolerate absence during the compatibility window, and remove old fields only after consumers and cached or public surfaces have moved.
- Separate transport compatibility from app-specific view models.

### Runtime and asynchronous seams

- For framework, runtime, package-manager, build-tool, or major dependency changes, inspect configuration, build and runtime images, CI commands, entry points, and an already migrated surface when available.
- Scheduled, queued, retried, event-driven, and outbox work has no request guarantee. Carry durable identity and tenant context explicitly rather than resolving it from request state.
- Verify executable bits, interpreter and shell selection, line endings, environment behavior, and failure handling when scripts change.

### Infrastructure and observability

- Render every environment affected by shared manifests or templates.
- Trace candidate rollout, health checks, traffic promotion, failure traps, rollback, and ready-replica restoration.
- Validate dashboards on empty, excluded, mixed, and boundary windows. Preserve driving rows through outer joins and quote variables according to the datasource.
- Judge access through the complete authentication, authorization, provisioning, and datasource chain.

### Scope

Judge scope against the intended outcome and owning boundary, not line count. Compatibility changes, tests, generated artifacts, and safe rollout work may be required. Adjacent product behavior and unrelated abstractions are out of scope unless they create a concrete changed failure.

Read [references/casebook.md](references/casebook.md) when the diff crosses contracts, runtimes, async execution, infrastructure, deployment, or observability.

## Findings

- `P0`: credible tenant, authorization, payment, secret, personal-data, or permanent data-loss path.
- `P1`: user- or operations-visible contract, runtime, rollout, or integrity failure.
- `P2`: bounded regression or missing validation with a concrete failure path.
- Omit suggestions without a reachable changed failure unless the user asks for them.

Use `blocked` only when the diff or a critical contract cannot be evaluated.

## Output

```text
Verdict: clean | findings | blocked
Reviewed: [changed surfaces and traced call chain]

Findings:
[P1][confidence 94] Title — path:line
Mechanism: [reachable failure]
Evidence: [code, test, runtime, or contract]
Direction: [smallest safe correction]
Validation: [exact check]

Verified non-findings: [important traps checked and rejected]
Verification needed: [at most two below-threshold items]
```
