# Compliance report template

- **Mode:** changed-files (default) | all-files
- **Auto-fix formatting:** yes | no
- **Scopes checked:** <count>
- **Result:** pass | fail

Per scope:
- `<path to AGENTS.md>`:
  - Format: ok | fail
  - Lint: ok | fail
  - Tests: ok | fail | skipped (optional)
  - Rule violations: none | <summary>

If failing:
- Missing scoped `AGENTS.md`: <paths>
- Missing/invalid `codex-guidelines` blocks: <paths>
- Command failures: <what + where>
- Rule violations: <what + where>

