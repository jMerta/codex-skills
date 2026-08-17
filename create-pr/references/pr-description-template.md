# Pull request template

Delete optional sections that do not apply. Replace every placeholder with verified information; do not leave fake evidence or successful-looking defaults.

```markdown
## Summary

- <Outcome visible to users or maintainers>
- <Second material change, if any>

## Why

<Problem, constraint, or linked issue that made the change necessary.>

## Changes

- <Focused implementation or behavior change>
- <Migration or compatibility change, if any>

## Validation

| Check | Result |
|---|---|
| `<exact command or manual scenario>` | Passed / Failed / Not run - <reason> |

## Evidence

<!-- Reuse relevant safe screenshots or recordings already made during the work. Capture new evidence when easy and useful. Delete this section when evidence is not relevant or practical. -->

- Scenario: <what the evidence proves>
- Environment: <browser/device/viewport or application version>

| Before | After |
|---|---|
| ![Before: <meaningful state>](<GitHub attachment URL>) | ![After: <meaningful state>](<GitHub attachment URL>) |

Recording: <GitHub-generated video attachment or stable artifact URL>

## Risk and rollout

- Risk: <edge cases, compatibility, security, or operational impact>
- Rollout: <deployment, migration, feature flag, or none>
- Rollback: <safe reversal or constraint>

## Related

- Closes #<issue>
- Follow-up: #<issue>
```

For non-visual changes, replace Evidence with concise logs, metrics, rendered output, or a reproducible verification result. Follow `evidence-attachments.md` for screenshots and recordings.
