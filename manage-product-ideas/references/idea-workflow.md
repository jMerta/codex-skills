# Product idea workflow

## Idea document

Use the repository's existing format when present. Otherwise use:

```markdown
# Idea name

Status: grilling
Classification: extension | reintroduction | new-domain | horizontal-capability | presentation-layer
Confidence: 0%

## Opportunity
## Target user
## Desired outcome
## Current product behavior
## Historical context
## Product rules
## Key scenarios
## Non-goals
## Dependencies
## Risks and failure modes
## Success metric
## Cheapest validation
## Open decisions
## Decision log
## Readiness
```

Suggested statuses: `exploratory`, `grilling`, `discovery`, `selected`, `planned`, `in-progress`, `delivered`, `validated`, `parked`, and `rejected`.

Every status change names its evidence and next decision.

## Decision tree

Resolve branches in dependency order:

1. **Problem:** user, situation, workaround, severity, frequency.
2. **Outcome:** changed behavior, value, success metric, stop condition.
3. **History:** current behavior, previous attempts, removal rationale, new evidence.
4. **Scope:** first useful release, non-goals, actors, permissions, surfaces.
5. **Rules:** lifecycle, eligibility, priority, time, money, conflicts, recovery.
6. **Scenarios:** happy path, empty state, concurrency, cancellation, expiry, partial failure.
7. **Trust:** privacy, consent, abuse, fairness, explainability, audit.
8. **Operations:** configuration, migration, rollout, observability, rollback.
9. **Validation:** cheapest experiment, evidence threshold, owner, next decision.

Ask each unresolved decision as:

```markdown
**Known evidence:** [what sources establish]

**Question:** [one unresolved decision]

**Recommendation:** [preferred answer], because [reason].
**Trade-off:** [main cost or alternative forgone].
```

## Classification

| Type | Meaning | Required scrutiny |
| --- | --- | --- |
| `extension` | Builds on an active capability | Contract and scope compatibility |
| `reintroduction` | Restores a removed capability | Removal rationale and changed conditions |
| `new-domain` | Adds a new product surface | Demand evidence and ownership boundaries |
| `horizontal-capability` | Supports several workflows | Concrete first outcome |
| `presentation-layer` | Explains or operates existing behavior | Source authority and permissions |

## Scorecard

Score resolved candidates from 0 to 5:

| Dimension | Weight |
| --- | ---: |
| User or customer outcome | 25 |
| Evidence | 20 |
| Existing product leverage | 15 |
| Speed of learning | 15 |
| Differentiation | 10 |
| Delivery feasibility | 10 |
| Trust and safety | 5 |

Weighted score = sum of `score / 5 × weight`. Report confidence separately. Explain the strongest evidence and largest assumption beside the score.

## Portfolio and selection

For an audit, identify contradictions, overlaps, missing strategic areas, and a `keep`, `grill`, `validate`, `select`, `park`, or `archive` decision per idea. Keep at most two active discovery candidates and one implementation candidate unless the user requests a broader portfolio.

Choose exactly one selection result: `implement next`, `validate next`, or `no candidate ready`.
