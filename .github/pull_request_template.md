## Summary

<!-- Describe the outcome in 1-3 bullets. -->

- ...

## Why

<!-- Explain the problem or link the issue. -->

## Changes

- ...

## Validation

<!-- Use exact commands and real results. Do not mark an unrun check as passed. -->

| Check | Result |
|---|---|
| `python scripts/build_skills_json.py --check` | ... |
| `python -m unittest discover -s scripts -p "test_*.py"` | ... |
| `python scripts/validate_skills.py` | ... |
| `python scripts/check_invisible_chars.py --all` | ... |
| `node --test cli/test/cli.test.js` | ... |

## Evidence

<!--
Reuse relevant safe screenshots or recordings already produced during the work.
Capture new evidence when it is easy and materially helps review; otherwise delete this section.
Upload through GitHub's attachment UI. Never use local file paths or expose secrets/personal data.
-->

## Risk and rollout

- Risk: ...
- Rollout / migration: ...
- Rollback: ...

## Related

<!-- Closes #123 -->
