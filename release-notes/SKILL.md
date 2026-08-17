---
name: release-notes
description: Use when the user asks to draft release notes, changelog entries, or GitHub Release text from commits, tags, branches, or merged pull requests. Resolves an exact Git range and surfaces breaking changes, migrations, security impact, and upgrade steps.
---

# Release notes

## Resolve the range

1. Read repository release conventions and determine the version, audience, and exact `from_ref..to_ref` range.
2. Derive the previous release from reachable tags when unambiguous. Ask before proceeding if multiple release lines or an unknown target make the range materially ambiguous.
3. Verify both refs and record their SHAs. Do not use a date window when an exact range is available.

## Gather evidence

1. Use first-parent history to identify release-sized changes, then inspect the full commit list and diff so squash, rebase, and direct commits are not missed.
2. Prefer the repository connector for linked PR and issue metadata; use the hosting CLI or local Git as fallback.
3. Read relevant diffs for configuration, API, schema, migration, dependency, runtime, deployment, and security changes. Do not infer impact from titles alone.
4. Separate user-visible changes from internal maintenance and omit noise that does not help the target audience.

## Write and verify

- Lead with what changed and why it matters.
- Call out breaking changes, prerequisites, data or configuration migrations, deprecations, security fixes, known issues, and rollback constraints explicitly.
- Include stable PR or issue references when available.
- Omit empty sections. Never invent verification, issue links, compatibility claims, or a release date.
- Recheck the range, diff statistics, and any migration or upgrade instruction before delivery.

Use `references/release-notes-template.md` as a menu, not a requirement to include every heading. Publishing a tag or hosted release requires separate explicit authorization.
