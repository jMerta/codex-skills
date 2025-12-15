# Language defaults (best-practice starting points)

Prefer the repo’s existing tooling. If missing, these are common, low-friction defaults:

- **Java/Kotlin**: Spotless (Gradle/Maven) + existing `check`/`test` tasks
- **TypeScript/JavaScript**: Prettier + ESLint (or Biome if already present)
- **Python**: Ruff (format + lint) + Pytest
- **Go**: `gofmt` + `go test ./...` (optional: `golangci-lint run`)
- **Rust**: `cargo fmt` + `cargo clippy` + `cargo test`
- **C#**: `dotnet format` + `dotnet test`

When possible, make the formatter operate on changed files by using `{files}` in the `codex-guidelines` commands.

