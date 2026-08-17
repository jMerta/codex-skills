---
name: branch-cleaner
description: Use when the user asks to list, audit, prune, or delete local or remote Git branches, especially stale, merged, gone-upstream, protected, worktree-bound, or open-PR branches. Identifies safe candidates and performs only explicitly authorized cleanup.
---

# Branch cleaner

## Workflow

1. Resolve the repository, current branch, remote, and remote default branch from Git. Ask only when they remain ambiguous.
2. Fetch and prune remote-tracking refs, then collect evidence:
   - `git status -sb`
   - `git worktree list --porcelain`
   - `git branch --merged <remote>/<default>` and `git branch --no-merged <remote>/<default>`
   - `git for-each-ref refs/heads --sort=committerdate --format="%(committerdate:iso8601) %(refname:short) %(upstream:short) %(upstream:track)"`
3. When GitHub context is available, prefer the GitHub connector for open/merged PR metadata and branch protection context. Use `gh` only as a fallback.
4. Exclude the current branch, the default branch, branches checked out in any worktree, protected patterns, and branches with open PRs.
5. Group candidates by evidence:
   - merged into the fetched default branch;
   - upstream gone;
   - old but unmerged, which is report-only unless the user explicitly approves force deletion.
6. Present concrete branch names, last commit dates, merge state, and local/remote scope before deleting anything.
7. Delete only approved candidates:
   - local merged branch: `git branch -d <branch>`;
   - remote branch: `git push <remote> --delete <branch>` only when remote deletion was explicitly requested;
   - use `git branch -D` only for an individually named unmerged branch explicitly approved by the user.
8. Re-run the candidate commands and `git status -sb` to verify the result.

## Safety

- Treat age as a review signal, never proof that a branch is safe to delete.
- Never delete through an unresolved glob or a generated command string.
- Do not remove a branch used by another worktree.
- Do not delete remote branches or force-delete unmerged branches without explicit approval.
- Preserve unrelated working-tree changes.

## Deliverable

Report deleted branches, skipped branches with reasons, commands run, and any candidates still needing a decision.
