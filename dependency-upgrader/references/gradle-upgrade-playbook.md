# Gradle, Maven, Java, and Kotlin upgrade playbook

## Locate the source of truth

Use the repository's existing location:

- Gradle version catalog or `build.gradle(.kts)`;
- platform or BOM constraints;
- `gradle-wrapper.properties`;
- Maven `dependencyManagement`, properties, or parent POM.

Do not duplicate a version already centralized by a catalog, platform, BOM, parent, or plugin.

## Resolve the dependency path

Use the committed wrapper and the relevant runtime, test, plugin, or build configuration. Common read-only reports are:

```text
<gradle-wrapper> dependencies --configuration <configuration>
<gradle-wrapper> dependencyInsight --dependency <group-or-artifact> --configuration <configuration>
<maven-wrapper> dependency:tree -Dincludes=<groupId>:<artifactId>
```

In a multi-project Gradle build, address the owning project and configuration explicitly. Record the selected version, conflict-resolution reason, scope, and full path from the root dependency.

## Audit known vulnerabilities

Run the repository's existing vulnerability task when present. Typical configured entrypoints are:

```text
<gradle-wrapper> dependencyCheckAnalyze
<gradle-wrapper> dependencyCheckAggregate
<maven-wrapper> org.owasp:dependency-check-maven:check
```

OWASP Dependency-Check uses NVD data and can produce coordinate/CPE false positives, so verify every match against the exact Maven coordinate and authoritative advisory. Its first database refresh may be slow. Do not add a persistent plugin, suppression, or external database integration merely for a one-off audit without user authorization.

Cross-check with OSV-Scanner and `vulnerability-audit-playbook.md`. OSV can scan supported Gradle lock/verification metadata and resolves Maven `pom.xml` transitives by default, but Maven test dependencies are not included in that computed graph. If Gradle has no supported lock data and no existing scanner, use the resolved Gradle reports to query exact coordinates and state that automated transitive coverage is incomplete.

For a vulnerable transitive, prefer upgrading the nearest direct library, plugin, framework platform, parent, or BOM that selects a patched version. Use Gradle constraints/resolution rules or Maven `dependencyManagement` overrides only as narrow temporary bridges with compatibility evidence and a removal condition.

## Select a compatible version

Cross-check official release and migration notes, Maven Central or the Gradle Plugin Portal, and compatibility among Java, Kotlin, Gradle, plugins, and frameworks. Prefer the smallest stable patched version that satisfies the request. Upgrade one major platform boundary at a time.

For framework and build-tool majors, identify removed APIs, configuration-key changes, bytecode/runtime requirements, generated-code changes, database migrations, and security defaults before editing.

## Preserve dependency verification

- Do not disable Gradle dependency verification or repository content filters.
- Review verification metadata changes and unexpected repositories or artifact coordinates.
- Generate new checksums or signatures only for artifacts intentionally introduced by the upgrade, then inspect the diff.
- Do not add insecure HTTP repositories or weaken checksum/signature modes to make resolution pass.

## Apply and verify

Use the committed Gradle wrapper or documented Maven wrapper. Update the central version source, refresh only the required dependencies where possible, and inspect lock and verification metadata. Repeat the same vulnerability check used for the baseline: rerun the configured task, or repeat the same OSV scan or exact-coordinate queries used when no task exists. Compare the complete before/after findings and dependency-path report. If no scanner or supported lock data exists, state that automated transitive coverage remains incomplete. Confirm the targeted advisory disappeared, then run focused tests followed by the repository's relevant build or CI-equivalent tasks.

Report old and new resolved versions, advisory IDs, dependency paths, compatibility decisions, scan coverage, metadata changes, commands, baseline comparison, and any migration or rollback requirement.

Official references: https://docs.gradle.org/current/userguide/viewing_debugging_dependencies.html, https://maven.apache.org/plugins/maven-dependency-plugin/tree-mojo.html, and https://dependency-check.github.io/DependencyCheck/.
