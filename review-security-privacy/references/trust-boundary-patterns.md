# Trust-boundary patterns

## Identity and tenant scope

Trace authentication claims, host or account resolution, relationship status, and resulting scope into every repository, cache, job, and provider operation. Reject request/body identifiers that can replace authoritative scope.

Background work must load durable scope or enumerate it deliberately; request-local identity is not available or trustworthy there.

## Public reads and writes

A public read can be safe when it resolves active scope, applies tenant, filter, range, and total bounds, and returns a dedicated minimized response. Public visibility alone is not a finding.

For a public write, inspect its concrete resource and abuse path: validation, per-source and per-scope limits, challenge or honeypot where appropriate, idempotency, storage growth, notification effects, and response leakage.

## Webhooks and provider callbacks

Parse only what is required to select verification configuration. Verify authenticity and freshness before trusting an external identifier for duplicate acknowledgement, tenant selection, or state changes. After verification, enforce replay protection and idempotent uniqueness or state transitions.

Persist only an explicit operational header allowlist. Omit authorization, cookies, signatures, unknown headers, raw bodies, and provider responses unless a documented requirement and redaction policy justify them.

## Logs and errors

Do not log or return credentials, tokens, auth headers, signatures, raw payloads, provider or SQL errors, personal identifiers, message content, or arbitrary request and response bodies. Prefer stable machine-readable codes and redaction-safe context.

## Files and exports

Trace authorization and ownership before generation and download. Validate user-controlled names and paths, prevent traversal or key confusion, constrain type and size, use safe content disposition and content type, and verify retention and deletion behavior.

## Administrative data access

Follow the entire deployed path: ingress and login methods, claim-to-role mapping, strictness and default-role interaction, resource or folder permissions, datasource or storage credentials, and environment overlay. A sensitive field or missing UI restriction is not a finding unless an unauthorized identity can complete the chain.
