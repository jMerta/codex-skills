---
name: ci-fix
description: Use when the user asks to diagnose or fix failing GitHub Actions checks on a pull request, branch, or workflow run, or wants CI log and root-cause analysis. Prefers GitHub connector context, uses gh for Actions logs, and verifies authorized fixes locally.
---

# CI fix

## Tool routing

- Prefer the GitHub connector for repository, pull request, patch, review, and check metadata.
- Use `gh` for current-branch PR discovery and GitHub Actions runs, jobs, artifacts, and logs.
- Do not claim the connector can retrieve Actions logs when that capability is unavailable.
- Treat non-GitHub Actions checks as external: report their status and URL unless the user asks for a separate provider investigation.

## Workflow

1. Resolve the repository and failing PR, branch, or run from the request and local Git context. Ask only if the target remains ambiguous.
2. Inspect the failing checks and record the check name, run URL, job, failing step, head SHA, and conclusion.
3. Pull the smallest useful log slice with `gh pr checks`, `gh run view`, or `gh api`. Never expose secrets from logs.
4. Compare the failure with the local diff and a known baseline. Distinguish a regression from flaky infrastructure, external service failure, missing credentials, or an unrelated baseline failure.
5. State the evidence-backed root cause and focused fix. Stop after diagnosis when the request does not authorize code or workflow changes.
6. Apply the smallest authorized fix. Read `references/ci-failure-playbook.md` only when its failure class is relevant.
7. Treat workflow triggers, token permissions, secrets, `pull_request_target`, and execution of fork code as security-sensitive. Do not broaden access merely to make a job pass.
8. Run the closest local equivalent. Push, rerun, or dispatch workflows only when the request authorizes that external change.
9. Recheck the exact failing check and report residual failures, unavailable logs, and unverified assumptions.

## Deliverable

Report the failing run and step, root cause, focused diff, local checks, resulting run status, and remaining risk. Do not report CI as green without a completed successful run.
