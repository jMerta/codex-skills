# Contributing

Thanks for contributing!

## Quickstart
1) Fork the repo and create a branch.
2) Make focused changes (avoid drive-by refactors).
3) If you add, rename, or change skill metadata, update `skills-meta.json` if needed and run `python scripts/build_skills_json.py`.
4) Install the validator dependency once: `python -m pip install pyyaml`.
5) Run the repository checks:
   - `python scripts/build_skills_json.py --check`
   - `python scripts/validate_skills.py`
   - `python scripts/check_invisible_chars.py --all`
   - `node --test cli/test/cli.test.js`
6) Open a PR with the repository template and include safe screenshots or recordings when they already exist or are easy and useful for review.

## Skill guidelines
- Skills live under `~/.agents/skills/**/SKILL.md` (user scope) or `.agents/skills/**/SKILL.md` in a repo (repo scope).
- `SKILL.md` must start with YAML frontmatter:
  - only `name` and `description` are allowed
  - `name`: lowercase letters, digits, and single hyphens; non-empty, <= 64 chars, single line; must match the folder name
  - `description`: starts with `Use when the user...`, states concrete invocation triggers, <= 500 chars, single line
- Every skill must include `agents/openai.yaml` with:
  - a non-empty `display_name`
  - a `short_description` of 25-64 characters
  - a `default_prompt` that mentions `$skill-name`
- Keep instructions concise; prefer checklists.
- Put long/reference material in `references/`.
- Update `skills-meta.json` to set category/author/license/source metadata for new skills.
