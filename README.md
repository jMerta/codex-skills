# Codex skills catalog

Personal Codex CLI skills (drop-in folders under `~/.codex/skills/`).

## How it works
- Codex discovers skills from `~/.codex/skills/**/SKILL.md` (loaded at startup).
- Only `name`, `description`, and the SKILL.md path are injected into context; bodies and `references/` are not auto-loaded (Codex can open/read them when needed).

## Enable skills (Codex CLI)
- Check: `codex features list` (look for `skills ... true`)
- Enable for the current run: `codex --enable skills`
- Enable permanently: add to `~/.codex/config.toml`:
  ```toml
  [features]
  skills = true
  ```

## What it looks like
![Codex CLI skills list](.github/codex-clipboard-VN1lya.png)

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
- `ci-fix`: Diagnose and fix failing GitHub Actions CI using GitHub CLI (`gh`).
- `coding-guidelines-gen`: Generate nested `AGENTS.md` coding guidelines per module + set up missing formatters/linters.
- `coding-guidelines-verify`: Verify changes follow scoped `AGENTS.md` rules; auto-fix formatting + run lint/tests.
- `commit-work`: Stage/split commits and write Conventional Commit messages.
- `create-pr`: Create PRs using GitHub CLI (`gh`).
- `dependency-upgrader`: Upgrade Java/Kotlin + Node/TypeScript dependencies safely.
- `docs-sync`: Keep `docs/` and other docs in sync with code changes.
- `plan-work`: Research + analysis + development planning for changes.
- `release-notes`: Draft release notes/changelog entries from git ranges.
- `skill-creator`: Create/update skills (workflow + templates).
- `vps-checkup`: Check Ubuntu VPS health/security/updates + Docker status over SSH (read-only unless confirmed).

## Contributing
- Each skill is a folder with a required `SKILL.md` (YAML frontmatter + Markdown body).
- Frontmatter requirements:
  - `name`: non-empty, <= 100 chars, single line
  - `description`: non-empty, <= 500 chars, single line

## License
MIT (see `LICENSE`).
