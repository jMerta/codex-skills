---
name: docs-sync
description: Use when the user asks to update documentation after code or configuration changes, audit documentation drift, or prepare README, API, runbook, or release docs. Changes only affected documentation and verifies examples, links, contracts, and operational steps against source code.
---

# Docs sync

## Find the documentation contract

1. Read repository instructions and the relevant code diff, commits, or release range.
2. Inspect existing working-tree changes before editing. Preserve them and stop for direction when required documentation edits overlap.
3. Identify the source of truth for each claim: code, schema, generated specification, configuration, script, or operational procedure.
4. Search for affected names, commands, routes, environment variables, defaults, and links across existing documentation.
5. Determine the audience and the smallest set of docs surfaces that must change.

Do not invent a new docs hierarchy, duplicate generated content, or rewrite unrelated prose. Edit generated docs only through their generator.

## Update minimally

- Preserve established structure, terminology, voice, headings, anchors, and versioning.
- Keep commands and examples copy/paste runnable and consistent with repository scripts and supported platforms.
- Document user-visible behavior, API or schema changes, configuration/default changes, migrations, rollback steps, and operational impact only when the code change creates them.
- Mark secrets as secrets and never paste real credentials or production values.
- Add an ADR only when the repository already records ADRs and the change is a durable architectural decision; `references/adr-template.md` is available when that convention applies.

## Verify

Run existing Markdown lint, link checks, snippet tests, API generation checks, or docs builds. Otherwise verify changed commands, paths, anchors, environment-variable names, and examples directly against their source of truth.

Report the files changed, the behavior each now documents, verification performed, and any documentation that remains intentionally unchanged.
