# Codex skills catalog

Personal Codex CLI skills (drop-in folders under `~/.codex/skills/`).

## Install

### macOS/Linux
```bash
git clone https://github.com/jMerta/codex-skills.git ~/.codex/skills
```

### Windows (PowerShell)
```powershell
git clone https://github.com/jMerta/codex-skills.git "$HOME\.codex\skills"
```

## Skills
- `agents-md`: Create nested `AGENTS.md` + feature maps.
- `bug-triage`: Reproduce, isolate, and fix bugs.
- `commit-work`: Stage/split commits and write Conventional Commit messages.
- `create-pr`: Create PRs using GitHub CLI (`gh`).
- `dependency-upgrader`: Upgrade Java/Kotlin + Node/TypeScript dependencies safely.
- `docs-sync`: Keep `docs/` and other docs in sync with code changes.
- `release-notes`: Draft release notes/changelog entries from git ranges.
- `skill-creator`: Create/update skills (workflow + templates).

## Contributing
- Each skill is a folder with a required `SKILL.md` (YAML frontmatter + Markdown body).
- Frontmatter requirements:
  - `name`: non-empty, <= 100 chars, single line
  - `description`: non-empty, <= 500 chars, single line
- `references/` (and other files) are not auto-loaded by Codex; only `name`, `description`, and the SKILL.md path are injected. Codex can open/read reference files when needed.

## License
MIT (see `LICENSE`).
