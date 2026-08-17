---
name: dependency-upgrader
description: Use when the user asks to update, bump, or migrate Java, Kotlin, Gradle, Maven, Node, or TypeScript dependencies; audit direct or transitive dependencies for CVEs or security advisories; or remediate a dependency vulnerability. Preserves the package manager, applies small verified upgrades, and checks vulnerability, release-age, and supply-chain risk.
---

# Dependency upgrader

## Establish the contract

1. Read repository instructions and detect the manifests, wrapper, version catalog, lockfile, selected package manager, and existing security tooling.
2. Confirm the requested packages, allowed version range, motivation, and whether major migrations are in scope. Treat "update dependencies" as the smallest compatible stable updates, not permission to upgrade every major.
3. Record current declared and resolved versions, dependency paths, and the smallest reliable baseline check before editing.
4. Stop and report when the working tree contains overlapping changes or the required tool is unavailable; do not switch package managers or regenerate a foreign lockfile.

## Select versions

1. Use current registry metadata plus official release notes, migration guides, compatibility tables, and security advisories.
2. Prefer the smallest stable version that solves the stated problem. Do not select prereleases or release candidates unless requested.
3. Group tightly coupled packages; otherwise update one dependency or low-risk group at a time.
4. For majors, identify runtime requirements, removed APIs, configuration changes, and rollback constraints before editing.

## Audit known vulnerabilities

Read `references/vulnerability-audit-playbook.md` for every dependency upgrade or vulnerability audit.

1. Audit each targeted dependency and its resolved transitive closure before selecting a version. When available, also run one repository-level scan to separate baseline findings from vulnerabilities introduced or retained by the upgrade.
2. Prefer repository-native checks and GitHub connector Dependabot or dependency-review data, then cross-check with the ecosystem audit command and OSV. Do not treat one database as complete.
3. Match every finding to the exact resolved package, version, scope, and dependency path. Record GHSA or OSV identifiers and the CVE alias when one exists; absence of a CVE identifier does not mean absence of a vulnerability.
4. Confirm affected and patched ranges in an authoritative advisory or vendor notice. Distinguish known exposure, practical reachability, false positives, withdrawn advisories, and coverage gaps.
5. Propose the nearest compatible patched version. For a vulnerable transitive dependency, prefer upgrading the nearest direct parent, platform, or BOM; use a temporary constraint or override only when a parent fix is unavailable or incompatible.

## Check supply-chain risk

Honor the repository's existing policy. If it has none, recommend a 72-hour minimum release-age gate for routine upgrades and document any exception for an urgent security fix. For Node, use the selected manager's setting from `references/node-upgrade-playbook.md`. For Gradle or Maven, follow repository policy or verify publication timestamps manually; do not invent a manager-neutral setting.

Before accepting the lockfile diff:

- review all new direct and transitive packages, versions, registries, URLs, integrity values, and lifecycle scripts;
- investigate unexpected package replacements, new maintainers, provenance changes, git/tarball sources, or a large transitive expansion;
- use registry signature or provenance verification when the selected manager and registry support it, without treating provenance as proof that code is safe;
- keep frozen-lockfile, vulnerability, and dependency-review checks enabled where the repository already uses them;
- never bypass an integrity, signature, policy, or vulnerability failure merely to finish the upgrade.

An urgent advisory may justify proposing a narrow age-gate exception. Apply it only after explicit user or repository-owner approval, after verifying the chosen fix and advisory, and when focused validation passes.

## Apply and verify

1. Use the repository's package manager or build wrapper and preserve its lockfile format.
2. Make the smallest manifest and lockfile change that represents the upgrade.
3. Inspect the diff before running package scripts. Use lockfile-only or ignore-scripts modes for discovery when supported; enable scripts only when required and trusted.
4. Run focused tests after each risk group, then the repository's relevant CI-equivalent checks.
5. Re-run the same vulnerability scans against the final resolved graph. Confirm the targeted advisory is absent, no new vulnerability was introduced, and the expected safe version and path are selected.
6. Compare failures with the baseline and revert unrelated churn rather than normalizing it.

Use `references/node-upgrade-playbook.md` or `references/gradle-upgrade-playbook.md` only for the detected ecosystem.

## Report

List old and new declared/resolved versions, dependency paths, advisory IDs and sources, affected and fixed ranges, scan timestamp and coverage gaps, reason and urgency, migration work, supply-chain checks, commands and results, baseline findings, and unresolved risks. Say "no known vulnerabilities found by these sources" rather than claiming the dependency is secure.
