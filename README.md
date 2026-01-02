# Codex skills catalog

Personal Codex CLI skills (drop-in folders under `~/.codex/skills/`).
Catalog: https://jmerta.github.io/codex-skills/

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

## Global AGENTS.MD ledger (not a skill)
Codex also supports a single, global ledger file that applies across projects. This is **not** a skill and does not live in the skills catalog.

### Create it
```bash
npx codex-skills init-ledger
```

Location (same root as the skills folder, without `/skills`):
- macOS/Linux: `~/.codex/AGENTS.MD`
- Windows (PowerShell): `$HOME\.codex\AGENTS.MD`

### Working with the ledger
- Keep exactly one ledger at `~/.codex/AGENTS.MD` so it applies to all projects.
- At the start of each assistant turn: open the ledger and refresh it with the current goal, constraints/assumptions, decisions, and state.
- Update it again whenever any of these change: goal, constraints/assumptions, key decisions, progress state (Done/Now/Next), or important tool outcomes.
- Keep it short and factual: use bullets, avoid transcripts, and mark unknowns as `UNCONFIRMED`.
- In replies, include a brief “Ledger Snapshot” (Goal + Now/Next + Open Questions); show the full ledger only when it materially changes or when requested.

Recommended ledger headings:
```md
- Goal (incl. success criteria):
- Constraints/Assumptions:
- Key decisions:
- State:
- Done:
- Now:
- Next:
- Open questions (UNCONFIRMED if needed):
- Working set (files/ids/commands):
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

## CLI (npx)
Use the published CLI to list, search, and install skills without cloning.      

```bash
npx codex-skills list
npx codex-skills search browser
npx codex-skills install agents-md
npx codex-skills install-category development
npx codex-skills install-all
npx codex-skills install-agent-scripts
npx codex-skills install agents-md --ref main
npx codex-skills init-ledger
npx codex-skills verify agents-md
```

### Add agent-scripts to PATH
After running `install-agent-scripts`, the scripts live under the agent skills
directory (for Codex: `~/.codex/skills/agent-scripts`). Add that folder to your
PATH if you want to call scripts directly from the terminal.

Windows (PowerShell):
```powershell
$path = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$path;$HOME\\.codex\\skills\\agent-scripts", "User")
```
Restart your terminal for changes to take effect.

macOS/Linux (bash/zsh):
```bash
export PATH="$PATH:$HOME/.codex/skills/agent-scripts"
```
To persist, add the export to `~/.bashrc` or `~/.zshrc`.

## Brave Search API keys
The `brave-search` skill uses the Brave Search API. Configure one or both of:
- `BRAVE_API_KEY` (primary)
- `BRAVE_AI_API_KEY` (fallback)

### Windows (PowerShell)
Set for the current session:
```powershell
$env:BRAVE_API_KEY = "your_key"
$env:BRAVE_AI_API_KEY = "your_key"
```

Persist for your user account:
```powershell
setx BRAVE_API_KEY "your_key"
setx BRAVE_AI_API_KEY "your_key"
```
Restart your terminal after using `setx`.

### macOS/Linux (bash/zsh)
```bash
export BRAVE_API_KEY="your_key"
export BRAVE_AI_API_KEY="your_key"
```
To persist, add the exports to `~/.bashrc`, `~/.zshrc`, or your shell profile.

## GitHub Pages catalog
The public catalog is published on GitHub Pages and updates on releases:
`https://jMerta.github.io/codex-skills/`

### How it works
- **Source of truth:** the CLI fetches `skills.json` from GitHub for the selected ref.
- **Default ref:** latest stable GitHub Release; if no releases exist, it falls back to the latest tag.
- **Override:** `--ref main` to follow `main`, or `--ref <tag>` to pin a specific release.
- **Install method:** downloads the repo tarball for the ref and copies only the requested skill folder into the agent’s skills directory.
- **Agent scripts:** `install-agent-scripts` copies `agent-scripts/` into the agent’s skills directory.
- **Auth (optional):** set `GITHUB_TOKEN` to reduce GitHub API rate limits.

### Commands
- `list` / `ls`: show all skills (grouped by category). Supports `--json`.      
- `search <query>`: search by name/description/category.
- `info <name>`: show metadata for a single skill.
- `install <name>`: copy the skill to the chosen agent path.
- `install-category <category>`: install all skills in a category.
- `install-all`: install every skill in the catalog.
- `install-agent-scripts`: install shared agent scripts alongside skills.
- `init-ledger`: create `~/.codex/AGENTS.MD` (global ledger, not a skill).
- `verify <name>`: verify a local skill install (checks SKILL.md + frontmatter).

### Common options
- `--agent <agent>`: target agent (default: `codex`).
- `--ref <ref>`: Git ref (tag or branch).
- `--force`: overwrite an existing skill install.
- `--json`: JSON output for `list`.

### Supported agents and install paths
- `codex`: `~/.codex/skills/` (default)
- `claude`: `~/.claude/skills/`
- `cursor`: `./.cursor/skills/` (project-local)
- `amp`: `~/.amp/skills/`
- `vscode` / `copilot`: `./.github/skills/` (project-local)
- `project`: `./.skills/` (portable)
- `goose`: `~/.config/goose/skills/`
- `opencode`: `~/.opencode/skills/`

### Maintaining the registry
If you add or rename skills:
1) Update `skills-meta.json` (category/author/license overrides as needed).
2) Run `python scripts/build_skills_json.py` to regenerate `skills.json`.
3) Commit both files.

## Skills
- `agents-md`: Create nested `AGENTS.md` + feature maps. (Author: @jMerta)
- `bug-triage`: Reproduce, isolate, and fix bugs. (Author: @jMerta)
- `ci-fix`: Diagnose and fix failing GitHub Actions CI using GitHub CLI (`gh`). (Author: @jMerta)
- `coding-guidelines-gen`: Generate nested `AGENTS.md` coding guidelines per module + set up missing formatters/linters. (Author: @jMerta)
- `coding-guidelines-verify`: Verify changes follow scoped `AGENTS.md` rules; auto-fix formatting + run lint/tests. (Author: @jMerta)
- `commit-work`: Stage/split commits and write Conventional Commit messages. (Author: @jMerta)
- `create-pr`: Create PRs using GitHub CLI (`gh`). (Author: @jMerta)
- `dependency-upgrader`: Upgrade Java/Kotlin + Node/TypeScript dependencies safely. (Author: @jMerta)
- `docs-sync`: Keep `docs/` and other docs in sync with code changes. (Author: @jMerta)
- `plan-work`: Research + analysis + development planning for changes. (Author: @jMerta)
- `release-notes`: Draft release notes/changelog entries from git ranges. (Author: @jMerta)
- `vps-checkup`: Check Ubuntu VPS health/security/updates + Docker status over SSH (read-only unless confirmed). (Author: @jMerta)

## Third-party skills
The following skills are sourced from `steipete/agent-scripts` (MIT). Author:   
@steipete
- `agent-scripts` (scripts bundle)
- `brave-search`
- `create-cli`
- `frontend-design`
- `oracle`
- `video-transcript-downloader`

Each copied skill folder includes a `LICENSE` and `ATTRIBUTION.md`. The
steipete-derived skills also include attribution sections in `SKILL.md`. Related
scripts live in `skills/agent-scripts` and include their own
`LICENSE`/`ATTRIBUTION.md`.

Additional third-party skills:
- `ui-ux-pro-max` (source: `nextlevelbuilder/ui-ux-pro-max-skill`, MIT). Author:
  Next Level Builder

## Contributing
- Each skill is a folder with a required `SKILL.md` (YAML frontmatter + Markdown body).
- Frontmatter requirements:
  - `name`: non-empty, <= 100 chars, single line
  - `description`: non-empty, <= 500 chars, single line

## Prompt-injection hardening (invisible characters)
This repo includes a CI check that scans for invisible/suspicious Unicode characters commonly used for deception/prompt injection:
- file contents and filenames (repo-wide)
- PR metadata (title/body) and commit messages (via GitHub Actions event payload)

Run locally:
- `python scripts/check_invisible_chars.py --all`
- `python scripts/check_invisible_chars.py --commit-range origin/main..HEAD`

Note: this mitigates common invisible-character attacks, but does not detect all Unicode deception (e.g., homoglyph/confusable characters).

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=jMerta/codex-skills&type=timeline&legend=top-left)](https://www.star-history.com/#jMerta/codex-skills&type=timeline&legend=top-left)

## License
MIT (see `LICENSE`).
