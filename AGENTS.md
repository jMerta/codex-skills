# Agent instructions (scope: this repository)

## Scope and layout
- This repo is a catalog of Codex skills (drop-in folders under `~/.agents/skills/`).
- Each skill is a folder containing a required `SKILL.md` plus optional `references/`, `scripts/`, and `assets/`.

## Conventions
- Keep `SKILL.md` frontmatter `name` and `description` single-line and within the constraints documented in `README.md`.
- Prefer concise, reusable guidance; keep longer docs and templates in `references/`.
- Avoid bulk-loading `references/` unless the task requires it.

## Verification (preferred commands)
- Verify the generated catalog: `python3 scripts/build_skills_json.py --check`
- Run validator regression tests: `python3 -m unittest discover -s scripts -p "test_*.py"`
- Validate skill metadata: `python3 scripts/validate_skills.py`
- Scan tracked content for suspicious invisible characters: `python3 scripts/check_invisible_chars.py --all`
- Install CLI dependencies: `npm ci --ignore-scripts --prefix cli`
- Audit CLI runtime dependencies: `npm audit --omit=dev --prefix cli`
- Test the CLI: `npm test --prefix cli`
- CI mirrors these commands in the GitHub Actions workflow **Validate skills**.

## Releases (GitHub Releases)
- Use SemVer tags without a `v` prefix (example: `1.2.3`).
- Cut releases from `main` with a clean working tree (`git status` should be empty) and all verification commands above passing.
- Keep `cli/package.json` version aligned with the release tag (the npm publish workflow enforces this).
- Ensure npm trusted publishing is configured for this repo (GitHub Actions OIDC).
- Decide the release range:
  - List tags: `git tag --sort=-creatordate | Select-Object -First 20`
  - Changes since last tag: `git log --first-parent --oneline <prev_tag>..HEAD`
  - Size check: `git diff --stat <prev_tag>..HEAD`
  - First release (no tags yet): summarize `git log --first-parent --oneline` from repo start.
- Draft release notes in `releases/<version>.md` using the template at `release-notes/references/release-notes-template.md` (commit it if you want it versioned alongside the code).
- Publish the release:
  - `gh release create <version> --title "codex-skills <version>" --notes-file releases/<version>.md --target main`
