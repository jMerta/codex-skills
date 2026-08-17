# Backend domain and API patterns

## Background work carries scope

Trace schedulers, listeners, retries, queues, and outboxes from the entry point to every service and repository. Require durable account, actor, or tenant identity, or deliberate enumeration. Request-local context is not a background identity source.

Validate by invoking the worker without an HTTP or security context and asserting the explicit scope used downstream.

## Transport shape versus canonical rule

Use inbound validation for malformed transport. Keep business invariants in domain or application code when jobs, events, imports, or other callers must obey them too.

Validate malformed requests at the controller boundary and the same invariant directly at its canonical owner.

## Authorization and ownership

Trace authenticated identity through policy resolution to every data operation. Do not trust a body, path, cache key, or frontend permission flag without server-side reconciliation.

Test the allowed owner, wrong owner, missing scope, inactive relationship, and changed state when those branches are material.

## Transactions and state transitions

Keep a transaction around the reusable unit of work, not only the HTTP adapter. Check partial writes, external calls inside transactions, optimistic or pessimistic concurrency, retries, and allowed and forbidden transitions.

## Stable errors and pagination

Preserve established status codes, machine-readable codes, redacted messages, and validation details. Never expose provider, SQL, stack, credential, or personal-data content through errors.

For pagination, preserve the repository's canonical fields, numbering convention, totals, sorting, empty-page behavior, and compatibility parsing. Do not replace a pageable contract with a list without tracing all consumers.
