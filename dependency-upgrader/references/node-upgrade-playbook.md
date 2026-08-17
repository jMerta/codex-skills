# Node dependency upgrade playbook

## Preserve the selected manager

Use the `packageManager` field and committed lockfile. If they disagree, stop and report the ambiguity.

| Lockfile | Manager | Routine age gate when no policy exists |
|---|---|---|
| `package-lock.json` | npm | `min-release-age=3` |
| `pnpm-lock.yaml` | pnpm | `minimumReleaseAge: 4320` |
| `yarn.lock` | Yarn | `npmMinimalAgeGate: 3d` |
| `bun.lock` or `bun.lockb` | Bun | `minimumReleaseAge = 259200` |

These values represent 72 hours in each manager's units. Use them only when the selected manager version supports the setting; otherwise verify publication timestamps and defer routine upgrades manually. They do not replace advisory, integrity, provenance, or code review. Prefer the repository's stricter value. Propose exceptions narrowly for a verified urgent fix, but do not apply one without explicit user or repository-owner approval.

## Inspect before installing

- Query the selected registry for stable versions and dist-tags.
- Read official migration notes for majors and framework releases.
- Inspect current package metadata, repository URL, publication time, maintainers, dependencies, and lifecycle scripts when available.
- Avoid broad `latest` updates and manager substitution.

## Audit known vulnerabilities

Run the command matching the committed manager and use its path command for every affected package:

| Manager | Full audit | Explain dependency path |
|---|---|---|
| npm | `npm audit --json` | `npm explain <package>` |
| pnpm | `pnpm audit --json` | `pnpm why <package>` |
| Yarn 1 | `yarn audit --json` | `yarn why <package>` |
| Yarn 2+ | `yarn npm audit --all --recursive --json` | `yarn why <package>` |
| Bun | `bun audit --json` | `bun why <package>` |

Audit all applicable workspaces and preserve the initial output. A non-zero exit normally means findings exist. Cross-check the targeted package closure with OSV-Scanner as described in `vulnerability-audit-playbook.md`.

Document coverage gaps: modern Yarn needs `--all --recursive` for all workspaces and transitives; npm audit does not cover peer dependencies; Bun skips packages outside its default registry audit. Registry audits transmit package/version inventory, so do not route private dependency data to an unintended public registry.

Do not run automatic audit fixes by default. Prefer an explicit direct dependency update. For transitives, upgrade the nearest direct parent first; use the manager's narrow override mechanism only as a documented temporary bridge. Never use `npm audit fix --force` to cross a major boundary without an explicit migration decision.

## Update narrowly

Use the selected manager's single-package add/update command with an explicit version. Preserve dependency versus dev-dependency placement. Keep runtime packages and their type packages compatible.

Before accepting the result, inspect both manifest and lockfile diffs. Pay special attention to:

- registry or tarball URL changes;
- git and exotic dependencies;
- integrity removal or churn;
- unexpected transitive packages;
- install, preinstall, postinstall, and prepare scripts;
- peer dependency warnings and runtime/engine changes.

For npm registries that support it, `npm audit signatures` verifies registry signatures and provenance attestations. Run the repository's dependency-review workflow when available. Do not claim that either proves the package's code is safe.

## Verify

Run the frozen-lockfile install, repeat the audit and dependency-path command, then run the repository's focused tests, type checks, lint, and build as applicable. Confirm the targeted advisory disappeared without introducing a new finding. Report exact commands and distinguish new failures from the recorded baseline.

Official audit references: https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities, https://pnpm.io/cli/audit, https://yarnpkg.com/cli/npm/audit, and https://bun.com/docs/pm/cli/audit.
