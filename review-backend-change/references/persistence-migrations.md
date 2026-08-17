# Persistence and migration patterns

## Ownership through the full persistence chain

Trace port or repository interface through adapter, query builder or mapper, SQL, schema, and returned mapping. Ownership may be enforced in the query or by an immediate adapter check, but no mismatched row may be mapped, cached, logged, mutated, or returned before rejection.

## Dynamic SQL

Parameterize values with the stack's bound-parameter mechanism. Permit raw identifiers or sort fragments only after request values are mapped through a closed allowlist to fixed SQL literals with a fixed fallback and direction.

Test supported, unknown, and malicious input.

## Query symmetry and edge cases

Compare data and count queries, filters, joins, tenant predicates, time bounds, soft-delete state, sort order, null handling, and pagination. Validate empty, later-page, duplicate, and boundary behavior where relevant.

## Migration identity

Derive the next migration identifier from the review base, excluding files introduced by the diff. Added migrations must form the repository's expected unique order. Do not edit an applied migration unless the repository explicitly uses a different immutable-history model.

## Safe expansion

Prefer rolling-compatible phases:

1. add nullable or compatible schema;
2. deploy code able to read old and new states;
3. backfill deterministically;
4. enforce constraints after incompatible rows are handled;
5. remove compatibility only after all deployed versions have moved.

Backfills must identify one authoritative source per row, handle nulls, orphans, duplicates, and conflicting ownership, and avoid environment-specific IDs or sensitive values.

## Constraints and indexes

Match keys and ownership columns to the domain invariant. Verify constraint column order, candidate keys, existing dirty data, query plans where performance is part of the change, and rollback or retry behavior.

Use a real database integration test when mapper, ORM mapping, SQL dialect, migration, or constraint behavior is the risk; mocks cannot prove those contracts.
