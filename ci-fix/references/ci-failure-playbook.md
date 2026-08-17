# GitHub Actions failure playbook

Load only the section matching the observed failure.

## Workflow does not start

- Compare workflow and required-check names with repository rules.
- Check event, branch, and path filters.
- Treat workflow renames as compatibility changes for branch protection.

## Invalid workflow

- Validate YAML structure, expressions, reusable-workflow inputs, and action versions.
- Check the workflow file at the failing head SHA, not only the current checkout.

## Permissions or secrets

- Identify the event and whether the run comes from a fork.
- Add only the permission required by the failing step.
- Do not switch to `pull_request_target` or execute untrusted code with secrets as a shortcut.

## Checkout, history, or submodules

- Use full history only when the failing tool needs it.
- Verify submodule URLs and credentials without printing tokens.
- Distinguish missing history from a genuinely missing file or tag.

## Cache or environment drift

- Compare runtime, package-manager, lockfile, working directory, and environment with local development.
- Test once without cache only when cache corruption is plausible.
- Do not hide lockfile or tool-version drift with retries.

## Flaky tests or external services

- Confirm nondeterminism from multiple runs or existing evidence before calling a test flaky.
- Prefer fixing time, randomness, isolation, or service stubbing over adding retries.
- Add a bounded retry only for an idempotent operation with a tracked follow-up.
