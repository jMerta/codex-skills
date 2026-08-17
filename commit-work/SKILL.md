---
name: commit-work
description: Use when the user asks to stage changes, create a Git commit, split work into logical commits, or craft a commit message. Inspects the worktree, preserves unrelated changes, stages only intended files or hunks, and follows repository conventions.
---

# Commit work

## Workflow

1. Read repository instructions and inspect the current branch, `git status`, unstaged diff, and staged diff.
2. Identify the user-authorized scope. Preserve unrelated, pre-existing, ignored, and untracked work.
3. Choose the fewest logical commits that keep unrelated concerns separate. Keep inseparable implementation and focused tests together.
4. Infer the message convention from repository instructions and recent commits. Use Conventional Commits only when required by the repository or requested by the user.
5. Stage explicit paths. Use patch staging for mixed files. Avoid `git add .`, `git add -A`, and `git commit -am` unless the whole worktree is confirmed in scope.
6. Review `git diff --cached`, `git diff --cached --stat`, and `git diff --cached --check`. Check for unrelated churn, debug output, credentials, generated files, and accidental deletions.
7. Run the smallest meaningful verification for the staged behavior and record the real result.
8. Compose the message from the staged outcome:
   - make the subject specific and imperative;
   - explain why or user-visible impact in the body only when it is not obvious;
   - add issue, co-author, sign-off, or breaking-change trailers only when true and repository-appropriate.
9. Commit without bypassing hooks. Verify the resulting subject and scope with `git show --stat --oneline --decorate HEAD`.
10. Repeat for the next boundary, then verify `git status -sb` and the resulting commit list.

## Safety

- A direct request to commit authorizes staging and committing the intended scope, not pushing it.
- Never discard, reset, amend, rebase, or include unrelated user changes without explicit authorization.
- Never use `--no-verify` merely to make a commit pass.
- Do not claim a check ran or passed unless its output was observed.

## References

- Read `references/commit-message-template.md` when drafting or reviewing a commit message.
- Read `references/conventional-commit-types.md` only when the repository uses Conventional Commits.

## Deliverable

Report each commit hash and subject, its scope, checks run, and any remaining worktree changes.
