# Node dependency upgrade playbook

## Preserve the selected manager

Use the `packageManager` field and committed lockfile. If they disagree, stop and report the ambiguity.

| Lockfile | Manager | Routine age gate when no policy exists |
|---|---|---|
| `package-lock.json` | npm | `min-release-age=3` |
| `pnpm-lock.yaml` | pnpm | `minimumReleaseAge: 4320` |
| `yarn.lock` | Yarn | `npmMinimalAgeGate: 3d` |
| `bun.lock` or `bun.lockb` | Bun | `minimumReleaseAge = 259200` |

These values represent 72 hours in each manager's units. Use them only when the selected manager version supports the setting; otherwise verify publication timestamps and defer routine upgrades manually. They do not replace advisory, integrity, provenance, or code review. Prefer the repository's stricter value and configure exceptions narrowly for a verified urgent fix.

## Inspect before installing

- Query the selected registry for stable versions and dist-tags.
- Read official migration notes for majors and framework releases.
- Inspect current package metadata, repository URL, publication time, maintainers, dependencies, and lifecycle scripts when available.
- Avoid broad `latest` updates and manager substitution.

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

Run the repository's focused tests, type checks, lint, build, and frozen-lockfile install as applicable. Report exact commands and distinguish new failures from the recorded baseline.
