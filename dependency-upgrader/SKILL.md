---
name: dependency-upgrader
description: Upgrade Java, Kotlin, Gradle, Maven, Node, or TypeScript dependencies with small verified changes and supply-chain safeguards. Use for routine version bumps, framework migrations, and vulnerability remediation.
---

# Dependency upgrader

## Establish the contract

1. Read repository instructions and detect the manifests, wrapper, version catalog, lockfile, and selected package manager.
2. Confirm the requested packages, allowed version range, motivation, and whether major migrations are in scope. Treat "update dependencies" as the smallest compatible stable updates, not permission to upgrade every major.
3. Record the current versions and run the smallest reliable baseline check before editing.
4. Stop and report when the working tree contains overlapping changes or the required tool is unavailable; do not switch package managers or regenerate a foreign lockfile.

## Select versions

1. Use current registry metadata plus official release notes, migration guides, compatibility tables, and security advisories.
2. Prefer the smallest stable version that solves the stated problem. Do not select prereleases or release candidates unless requested.
3. Group tightly coupled packages; otherwise update one dependency or low-risk group at a time.
4. For majors, identify runtime requirements, removed APIs, configuration changes, and rollback constraints before editing.

## Check supply-chain risk

Honor the repository's existing policy. If it has none, recommend a 72-hour minimum release-age gate for routine upgrades and document any exception for an urgent security fix. See `references/node-upgrade-playbook.md` for manager-specific settings.

Before accepting the lockfile diff:

- review all new direct and transitive packages, versions, registries, URLs, integrity values, and lifecycle scripts;
- investigate unexpected package replacements, new maintainers, provenance changes, git/tarball sources, or a large transitive expansion;
- use registry signature or provenance verification when the selected manager and registry support it, without treating provenance as proof that code is safe;
- keep frozen-lockfile and dependency-review checks enabled where the repository already uses them;
- never bypass an integrity, signature, policy, or vulnerability failure merely to finish the upgrade.

An urgent CVE may justify bypassing the age gate only when the chosen version and advisory are verified, the exception is explicit, and focused validation passes.

## Apply and verify

1. Use the repository's package manager or build wrapper and preserve its lockfile format.
2. Make the smallest manifest and lockfile change that represents the upgrade.
3. Inspect the diff before running package scripts. Use lockfile-only or ignore-scripts modes for discovery when supported; enable scripts only when required and trusted.
4. Run focused tests after each risk group, then the repository's relevant CI-equivalent checks.
5. Compare failures with the baseline and revert unrelated churn rather than normalizing it.

Use `references/node-upgrade-playbook.md` or `references/gradle-upgrade-playbook.md` only for the detected ecosystem.

## Report

List old and new versions, reason, migration work, supply-chain checks, commands and results, baseline failures, and any unresolved risks or deferred majors.
