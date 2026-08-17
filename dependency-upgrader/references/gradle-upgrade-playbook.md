# Gradle, Maven, Java, and Kotlin upgrade playbook

## Locate the source of truth

Use the repository's existing location:

- Gradle version catalog or `build.gradle(.kts)`;
- platform or BOM constraints;
- `gradle-wrapper.properties`;
- Maven `dependencyManagement`, properties, or parent POM.

Do not duplicate a version already centralized by a catalog, platform, BOM, parent, or plugin.

## Select a compatible version

Cross-check official release and migration notes, Maven Central or the Gradle Plugin Portal, and compatibility among Java, Kotlin, Gradle, plugins, and frameworks. Prefer the smallest stable version that satisfies the request. Upgrade one major platform boundary at a time.

For framework and build-tool majors, identify removed APIs, configuration-key changes, bytecode/runtime requirements, generated-code changes, database migrations, and security defaults before editing.

## Preserve dependency verification

- Do not disable Gradle dependency verification or repository content filters.
- Review verification metadata changes and unexpected repositories or artifact coordinates.
- Generate new checksums or signatures only for artifacts intentionally introduced by the upgrade, then inspect the diff.
- Do not add insecure HTTP repositories or weaken checksum/signature modes to make resolution pass.

## Apply and verify

Use the committed Gradle wrapper or documented Maven wrapper. Update the central version source, refresh only the required dependencies where possible, inspect lock and verification metadata, then run focused tests followed by the repository's relevant build or CI-equivalent tasks.

Report old and new versions, compatibility decisions, metadata changes, commands, baseline comparison, and any migration or rollback requirement.
