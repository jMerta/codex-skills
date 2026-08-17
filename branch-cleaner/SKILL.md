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
4. Exclude the current branch, the default branch, branches checked out in any worktree, protected branches or rulesets, and branches with open PRs. If open-PR or protection state cannot be verified, keep the branch report-only.
5. Group candidates by evidence:
   - merged into the fetched default branch;
   - upstream gone;
   - old but unmerged, which is report-only unless the user explicitly approves force deletion.
6. Present concrete branch names, last commit dates, merge state, and local/remote scope before deleting anything.
7. Delete only approved candidates:
   - immediately before each deletion, fetch current evidence and recheck the branch tip SHA, worktree use, open PRs, and protection or ruleset state against the reviewed candidate;
   - skip the branch if its tip or state changed, or if any safety check is unavailable;
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
