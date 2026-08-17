# Commit message template

Follow the repository's established convention. When it uses Conventional Commits, start with:

```text
<type>(<optional-scope>)<!>: <imperative outcome>

<Why the change was needed and any non-obvious behavior or migration impact.>

<Optional trailers such as Refs, Closes, Co-authored-by, or BREAKING CHANGE.>
```

Omit empty body and trailer sections. The subject should describe one outcome, not the editing process.

## Examples

Small fix with an obvious reason:

```text
fix(auth): reject expired refresh tokens
```

Change that needs context:

```text
refactor(skills): make descriptions trigger-first

Discovery loads descriptions before skill bodies, so invocation criteria must
be explicit in frontmatter.
```

Breaking change:

```text
feat(api)!: remove the legacy customer endpoint

Consumers must migrate to /v2/customers before deploying this release.

BREAKING CHANGE: /v1/customers is no longer available.
```

## Review checklist

- Match the repository's language, capitalization, scope, and subject style.
- Prefer `Add`, `Fix`, `Remove`, `Prevent`, or another concrete outcome over `Update` or `Changes`.
- Explain what and why; do not paste a work log, diff summary, or unverified test claim.
- Add `Closes #123` only when merge should close that issue.
- Add `Co-authored-by` and sign-off trailers only when they are factually required.
- Mark breaking behavior with the repository's expected header or footer syntax.
