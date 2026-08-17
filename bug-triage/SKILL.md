---
name: bug-triage
description: Use when the user reports a bug, regression, runtime error, failing build, or broken test and wants reproduction, diagnosis, root-cause analysis, or an authorized fix. Isolates the shared cause and verifies the smallest relevant change.
---

# Bug triage

## Establish scope

1. Read repository instructions and inspect the current branch, status, and relevant diff.
2. Determine whether the user asked only for diagnosis or also authorized a fix.
3. Inspect available errors, logs, tests, and code before asking for missing details.
4. Record expected behavior, actual behavior, environment, frequency, and last known good state when they affect the investigation.

## Reproduce and isolate

1. Use the smallest reliable reproduction. Preserve the original failure output.
2. If the failure is intermittent, control time, randomness, concurrency, data, and retries one variable at a time.
3. Trace the failing path end to end. Search every caller of the function or component before editing it.
4. Form a falsifiable hypothesis and run the narrowest check that can confirm or reject it.
5. Use history or `git bisect` only when a regression boundary will materially shorten the search.

Separate these outcomes explicitly:

- confirmed product regression;
- pre-existing or baseline failure;
- environment, credentials, service, or dependency failure;
- insufficient evidence to reproduce.

## Fix when authorized

1. Add or adapt the smallest regression check that fails for the confirmed cause.
2. Fix the shared root cause rather than guarding one visible caller.
3. Avoid unrelated refactors, dependency upgrades, formatting churn, and broad exception handling.
4. Re-run the reproduction, focused regression check, and the smallest relevant project checks.

Use the package manager, wrapper, and commands already selected by the repository. Infer them from repository instructions, manifests, lockfiles, and scripts; do not substitute another tool just because it is installed locally.

## Report

Include:

- **Observed:** exact symptom and affected scope.
- **Root cause:** confirmed explanation, or the leading hypothesis clearly labeled.
- **Change:** files and behavior changed, or `diagnosis only`.
- **Verification:** commands and results, including baseline failures.
- **Remaining risk:** untested paths, flaky behavior, or external blockers.

Use `references/bug-report-template.md` only when the user needs a reusable intake form.
