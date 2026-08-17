# Validation patterns

## Authorization, ownership, and state

A happy-path boundary test with a mocked service does not prove ownership or a canonical state rule. Protect transport wiring at the boundary and wrong-owner, forbidden-state, or idempotency behavior at the layer that owns it.

Do not duplicate every invariant at every layer when one lower-level test proves the rule and the boundary test proves wiring.

## Persistence and migrations

Use the real database dialect for mapper or ORM mappings, backfills, constraints, indexes, and migration ordering. Include representative valid, null, orphan, duplicate, conflicting-owner, and retry data only when those cases are reachable.

## Asynchronous and retry behavior

Exercise work without request state. Verify durable scope, duplicate delivery, retry, partial failure, and safe resumption when those paths changed.

## Material UI versus copy-only

Layout, overlay, responsive navigation, focus, sticky actions, or animation changes need focused interaction checks and representative visual evidence. Copy-only changes generally need render or localization checks, not screenshot gates.

## Harness portability

When parsers, scripts, fixtures, or setup files change, verify the focused test reaches real assertions on supported platforms. Check line endings, executable bits, interpreter choice, path handling, locale, and time zone only where relevant.

## External CI failure

Locate the exact failing step and determine whether checkout, dependency setup, build, or tests began. Record provider outages and cancelled jobs as missing evidence. Do not create a code finding without a repository-controlled failure mechanism.
