# Architecture and scope casebook

Use the closest applicable pattern, then inspect current code. Examples describe mechanisms, not frozen repository conventions.

## Additive cross-application rollout

**Trigger:** A producer contract changes with independently deployed consumers.

**Inspect:** Search the field, route, type, and serialized name across all applications. Trace only real consumers and model both version orders.

**Failure:** A required rename lands in producer and consumers in one commit, but deployments are not atomic.

**Safe direction:** Add the new field while retaining the old one, make consumers prefer new and fall back to old, then remove the old field after the compatibility window.

**Validation:** Contract tests for old, missing, null, and new shapes plus checks for each actual consumer.

## Request context in asynchronous work

**Trigger:** A scheduler, listener, retry, queue worker, or outbox reaches scoped behavior.

**Inspect:** Trace the entry point through every service and repository. Locate durable actor, account, tenant, or resource identity.

**Failure:** Background work reads identity from request-local state that does not exist or belongs to another request.

**Safe direction:** Persist or enumerate the required scope deliberately and pass it through the full call chain.

**Validation:** Invoke work without request state and verify the explicit scope used for every read and write.

## Runtime migration seam

**Trigger:** A framework, runtime, package manager, build plugin, or major version changes.

**Inspect:** Dependency manifests, configuration conventions, builders, runtime images, CI, entry points, and an already migrated module.

**Failure:** Versions and lockfiles move while one removed runtime convention remains in configuration.

**Validation:** Focused tests, type or compile checks, and the affected production build.

## Empty-window aggregation

**Trigger:** Dashboard or reporting SQL adds exclusions, time spines, totals, or variables.

**Inspect:** Join placement, nullable-side filters, final joins, zero-row behavior, time zones, and variable quoting.

**Failure:** A filter after an outer join or a final inner join erases the driving row, so a valid empty window disappears instead of returning zero.

**Safe direction:** Keep nullable-side predicates in the join, drive from the time or label set, left-join aggregates, and coalesce the final measure.

## Rollout and rollback

**Trigger:** Deployment workflows, health gates, traffic selectors, replica counts, or rollback scripts change.

**Inspect:** Candidate start, internal verification, public promotion, failure trap, selector restoration, and ready capacity.

**Failure:** Traffic switches before verification or rollback selects no ready instance.

**Validation:** Render every affected environment and exercise success plus failure restoration paths.
