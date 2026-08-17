---
name: rebase-assistant
description: Safely rebase a Git branch onto an explicit or discovered target, resolve conflicts by intent, and verify rewritten history. Use when asked to rebase, update a branch, or handle rebase conflicts.
---

# Rebase assistant

## Workflow

1. Resolve the current branch, remote, and target. Use the requested target; otherwise discover the remote default branch from `refs/remotes/<remote>/HEAD` or remote metadata.
2. Record the current HEAD and inspect `git status -sb`. Stop on a detached HEAD or dirty worktree rather than stashing or discarding changes automatically.
3. Fetch and prune the target remote, then confirm the target ref exists.
4. Run `git rebase <target>`. A direct rebase request authorizes this command; do not add an extra confirmation when the target is unambiguous.
5. For conflicts:
   - list unresolved paths with `git diff --name-only --diff-filter=U`;
   - inspect the conflict, the replayed commit, and stages `:1:`, `:2:`, and `:3:` when useful;
   - remember that during rebase, **ours** is the target/upstream side and **theirs** is the commit being replayed;
   - resolve content by intended behavior, not by blanket side selection;
   - make delete/modify, rename, generated-file, and binary choices explicit;
   - stage resolved paths and continue with `git rebase --continue`.
6. If intent cannot be established safely, stop in the conflict state and report the exact decision needed. Do not abort or discard resolutions automatically.
7. Verify:
   - clean `git status -sb` and no rebase state;
   - target ancestry with `git merge-base --is-ancestor <target> HEAD`;
   - commit equivalence with `git range-diff <target>...<old-head> <target>...HEAD` when the branch had commits to replay;
   - changed-file scope and the smallest relevant tests.
8. Do not push unless requested. Rewritten published history requires separate explicit approval for `git push --force-with-lease`.

## Safety

- Never use `git reset --hard`, `git clean`, automatic stash, or blanket ours/theirs resolution.
- Preserve unrelated worktrees and user changes.
- Treat generated files according to repository instructions and regenerate them when required.

## Deliverable

Report the exact target and command, old and new HEAD, conflicts and resolutions, verification results, and whether a force-push would be required.
