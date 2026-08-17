---
name: commit-work
description: Create reviewable Git commits by inspecting the worktree, staging only intended changes, choosing logical boundaries, and writing repository-appropriate messages. Use when asked to stage, commit, split commits, or craft commit messages.
---

# Commit work

## Workflow

1. Read repository instructions and inspect `git status`, unstaged diffs, staged diffs, and the current branch.
2. Identify the user-authorized scope. Preserve unrelated, pre-existing, ignored, and untracked work.
3. Choose the fewest logical commits that keep unrelated concerns separate. Do not split inseparable code and its focused test merely to increase commit count.
4. Follow the repository's commit convention. Use Conventional Commits only when required by the repository or requested by the user.
5. Stage explicit paths. Use patch staging for mixed files. Avoid `git add .` and `git add -A` unless the whole worktree is confirmed in scope.
6. Review `git diff --cached` and `git diff --cached --check`. Check for unrelated churn, debug output, credentials, generated files, and accidental deletions.
7. Run the smallest meaningful verification for the staged behavior and record the real result.
8. Commit with a concise subject describing the outcome. Add a body only when the reason, migration, or breaking effect is not obvious.
9. Repeat for the next boundary, then verify `git status -sb` and the resulting commit list.

## Safety

- A direct request to commit authorizes staging and committing the intended scope, not pushing it.
- Never discard, reset, amend, rebase, or include unrelated user changes without explicit authorization.
- Do not claim a check ran or passed unless its output was observed.

## References

Read `references/commit-message-template.md` and `references/conventional-commit-types.md` only when the repository uses Conventional Commits.

## Deliverable

Report each commit hash and subject, its scope, checks run, and any remaining worktree changes.
