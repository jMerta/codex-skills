---
name: review-security-privacy
description: Use when the user asks for a pre-PR or diff security and privacy review, especially for authentication, authorization, tenant isolation, public endpoints, webhooks, payments, secrets, logs, personal data, files, exports, or observability access. Reports only reachable regressions introduced or materially changed by the diff.
---

# Security and Privacy Review

Review only unless the user separately authorizes fixes. Do not probe production, post comments, change pull-request state, or expose sensitive data.

## Review flow

1. Establish the base, diff, intended behavior, changed trust boundaries, and attacker- or user-controlled inputs.
2. Read repository security and ownership instructions for every changed surface.
3. Trace each changed path from identity or input through authentication, authorization, state, storage, logs, asynchronous work, and output.
4. Inspect the nearest tests and real enforcement point. UI visibility is not authorization.
5. Exclude pre-existing debt, keyword matches, style preferences, and hypothetical failures without a reachable mechanism.
6. Report only regressions introduced, worsened, or materially touched by the diff with confidence of at least 80/100, anchored to a changed file or line.

Use evidence in this order: changed code and full trust or call chain, behavior-protecting tests, runtime configuration, repository security instructions, then other documentation.

Read [references/trust-boundary-patterns.md](references/trust-boundary-patterns.md) when the diff touches tenant resolution, public reads or writes, webhooks, files, secrets, logs, personal data, provider integrations, or administrative observability.

## Core checks

- Resolve identity and tenant scope from an authoritative source and preserve it through every read, write, cache key, job, and provider call.
- Recheck authorization and mutable state at the server-side operation, independent of frontend preflight.
- Authenticate webhook or provider messages before trusting identifiers for acknowledgement, deduplication, tenant selection, or state changes.
- Bound and minimize public reads. For public writes, inspect the endpoint's actual abuse mechanism, validation, rate limits, idempotency, and response leakage.
- Store and log only an allowlist of required operational fields. Redact or omit credentials, tokens, cookies, signatures, payloads, provider errors, personal data, and message content.
- Validate uploads and exports by authorization, ownership, type, size, path or key construction, storage permissions, retention, and response headers.
- Trace administrative data access through the complete login, role mapping, provisioning, and datasource or storage permission chain.
- Keep secrets environment-managed and out of code, diffs, logs, tests, screenshots, and generated artifacts.

## Findings

- `P0`: credible authorization or tenant bypass, payment compromise, secret or personal-data exposure, or permanent data loss.
- `P1`: reachable security-control, integrity, abuse, privacy, or rollout failure.
- `P2`: bounded regression with a concrete reachable path.
- Omit low-confidence hardening suggestions unless the user explicitly asks for them.

Use `blocked` only when the diff or a critical trust contract cannot be evaluated. Put at most two sub-threshold uncertainties under `Verification needed`.

## Output

```text
Verdict: clean | findings | blocked
Reviewed: [changed surfaces and traced trust chain]

Findings:
[P1][confidence 94] Title — changed/path:line
Mechanism: [input or identity -> bypass or exposure -> impact]
Evidence: [code, test, or runtime configuration]
Direction: [smallest safe correction]
Validation: [exact negative test or safe check]

Verified non-findings: [important traps inspected and rejected]
Verification needed: [at most two below-threshold items]
```
