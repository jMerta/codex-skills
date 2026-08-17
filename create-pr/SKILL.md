---
name: create-pr
description: Use when the user asks to prepare, publish, or open a GitHub pull request from a local checkout. Verifies branch and diff scope, runs relevant checks, creates needed commits, pushes only when authorized, and opens a truthful draft or ready PR.
---

# Create a pull request

## Tool routing

- Use local Git for repository identity, branch, diff, staging, commits, and push.
- Prefer the GitHub connector for repository and PR context and for PR creation after the branch is pushed.
- Use `gh` for authentication checks, Actions logs, current-branch PR discovery, forked-head syntax, or PR creation when connector coverage is insufficient.

## Prepare the branch

1. Read repository instructions and resolve the repository root, current branch, remotes, upstream, and remote default branch.
2. Inspect `git status --short --branch`, the merge base, `git log --oneline <base>..HEAD`, `git diff --stat <base>...HEAD`, and the full diff.
3. Confirm scope only when the worktree mixes unrelated changes. Preserve user changes outside the requested scope.
4. Stay on an existing feature branch. If currently on the default branch, create a descriptive branch using the repository or host convention.
5. Fetch the target remote when current remote state matters. Rebase or merge only when requested or required by repository policy.

## Validate and commit

1. Run the relevant focused checks and any required repository gates. Separate regressions from baseline or environment failures.
2. Create the fewest reviewable commits. Follow repository message conventions and inspect the staged diff before every commit.
3. Recheck the final range and worktree. Do not include unrelated commits, local-only files, credentials, or generated artifacts by accident.

## Write the PR

1. Build the title from the actual outcome. Follow the repository's title convention; do not copy a vague branch name.
2. Start from `references/pr-description-template.md` or the repository's own pull request template.
3. State what changed, why, validation with real results, user or operational impact, risk, migrations, rollout, and related issues.
4. Delete empty optional sections. Never claim unrun checks, nonexistent screenshots, or future work as completed.
5. Collect visual evidence when the change affects UI, layout, motion, or a visible bug. Follow `references/evidence-attachments.md`.

## Publish and open

1. Push only when the user requested or confirmed publication. For a new remote branch, use `git push -u <remote> <branch>`.
2. Never force-push without separate explicit approval. If approved, use `--force-with-lease` against the intended remote branch.
3. Resolve repository, base, and head explicitly, especially for forks.
4. Open a draft unless the user asks for ready-for-review.

Preferred connector fields:

```text
repository_full_name: <owner/repo>
base: <target-branch>
head: <source-branch or owner:branch>
title: <reviewed title>
body: <reviewed Markdown>
draft: true
```

`gh` fallback:

```text
gh pr create --repo <owner/repo> --base <base> --head <head-or-owner:branch> --title "<title>" --body-file <prepared-body.md> --draft
```

Prefer explicit title and body over unreviewed `--fill`. `--body-file` publishes Markdown text; it does not upload files referenced by local paths.

## Attach and verify evidence

1. Create the draft PR with the textual evidence section first.
2. Upload local screenshots or recordings through GitHub's attachment UI, or through a connected tool only if it supports user-attachment uploads.
3. Replace placeholders with GitHub-generated URLs, add accessible labels and context, then save the description or evidence comment.
4. Reopen the PR and verify every image or recording renders for the intended audience. Do not claim an attachment exists until the remote PR shows it.

## Verify the PR

Confirm URL, repository, base/head, draft state, title/body, included commits, changed-file scope, evidence links, and current checks. Connector metadata is preferred; `gh` fallbacks include:

```text
gh pr view --json url,number,title,baseRefName,headRefName,isDraft,commits,mergeable,statusCheckRollup
gh pr checks <number>
```

Do not manually rerun checks unless the user authorizes it.

## Safety

- Do not silently stage unrelated work or create a PR from the wrong repository or branch.
- Do not run interactive authentication on the user's behalf; report the exact prerequisite when authentication is missing.
- Do not expose secrets, personal data, private URLs, customer data, or unrelated browser content in PR evidence.
- Do not commit screenshots or recordings solely to attach them unless the repository explicitly requires versioned evidence.

## Deliverable

Report branch, commits, push target, PR URL and state, validation, attached evidence, pending manual evidence steps, check status, and unresolved risks.
