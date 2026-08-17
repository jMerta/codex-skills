---
name: create-pr
description: Prepare and open a focused GitHub pull request from a local checkout, including branch strategy, validation, commits, push, and a truthful PR description. Use when asked to prepare, publish, or open a PR.
---

# Create a pull request

## Tool routing

- Use local Git for branch, diff, staging, commits, and push.
- Prefer the GitHub connector for repository and PR context and for PR creation after the branch is pushed.
- Use `gh` as a fallback for authentication checks, current-branch PR discovery, forked-head syntax, or PR creation when connector coverage is insufficient.

## Workflow

1. Read repository instructions. Inspect status, branch, remotes, upstream, remote default branch, and the diff from the merge base.
2. Confirm the intended scope only when the worktree mixes unrelated changes. Preserve user changes outside that scope.
3. Stay on an existing feature branch. When starting from the default branch, create a descriptive branch using the repository or host convention.
4. Implement the focused change and run the repository's relevant checks. Record blockers separately from regressions.
5. Create reviewable commits. Follow the repository's message convention and inspect the staged diff before every commit.
6. Push only when publication is requested or confirmed. Never force-push without explicit approval; if approved, use `--force-with-lease`.
7. Resolve the base repository, base branch, and head branch explicitly, especially for forks.
8. Open a draft PR unless the user asks for ready-for-review. Prefer the GitHub connector; fall back to `gh pr create` when needed.
9. Build the title and body from the actual diff and commits. Include what changed, why, validation, user impact, risk, migrations, and screenshots only when they exist.
10. Verify the PR URL, base/head branches, draft state, included commits, and check status.

## Safety

- Do not silently stage unrelated work or create a PR from the wrong repository or branch.
- Do not run interactive authentication on the user's behalf; report the exact prerequisite when authentication is missing.
- Do not describe unrun checks as successful or attach placeholder evidence.

## Deliverable

Report the branch, commits, push target, PR URL and state, validation, and unresolved risks.
