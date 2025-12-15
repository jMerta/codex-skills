# Spotless quick-start (JVM)

Prefer existing formatting/linting conventions in the repo. If missing, use Spotless as the formatter of record.

## Gradle (Kotlin DSL) sketch
Add Spotless and wire tasks into your verifiable commands:

- `spotlessApply` (auto-fix formatting)
- `spotlessCheck` (verify formatting)

Keep config minimal; follow the repo’s Gradle patterns (version catalogs, plugin management, etc.).

## Maven sketch
Use:

- `spotless:apply` (auto-fix formatting)
- `spotless:check` (verify formatting)

Use the repo’s existing Maven structure (parent POMs, pluginManagement) and keep changes scoped to the module.

