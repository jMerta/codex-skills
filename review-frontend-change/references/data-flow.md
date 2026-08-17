# Frontend data-flow patterns

## Select the owning client

Trace the changed service to the application's actual HTTP or RPC client, authentication hook, return shape, and error behavior. Similar applications may use different token ownership, response wrappers, refresh logic, or server/client boundaries.

Do not add caller tokens, response checks, or casts copied from another app without confirming the local contract.

## Scope cache and query keys

Include every request input that changes the result: entity ID, filters, page, sort, locale, feature state, and active account, organization, user, or tenant when identity can switch. Align invalidation prefixes with the scoped keys.

Validate by rerendering or refetching under a second identity with identical filters and asserting a distinct request and result.

## Decode external data

Treat network JSON as `unknown` unless a trusted generated client enforces the contract. Narrow or map it before it reaches cache or UI. A contained compatibility cast is not by itself a finding; report it only when malformed data can escape.

For anonymous requests, verify credentials, caching, bounds, encoded inputs, error fallback, and the actual backend response minimization.

## Normalize pagination

Read the producer's canonical fields first and support legacy shapes only as compatibility input. Preserve totals and page metadata on empty later pages rather than replacing them with current content length.

Test canonical, compatibility, empty, and malformed shapes when the normalizer changes.

## Preserve demo and preview isolation

Trace demo, preview, fixture, and story clients to their local resolver or mock. Reject accidental production authentication, backend URLs, live network calls, or external mutations when the surface is intended to be standalone.
