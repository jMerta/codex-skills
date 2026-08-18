# Codex skills

Reusable engineering, product, documentation, review, and operations workflows for Codex.

[Browse the catalog](https://jmerta.github.io/codex-skills/) or list it from the terminal:

```bash
npx codex-skills list
```

## Install

The CLI requires Node.js 18 or newer.

```bash
# Install one skill for the current user
npx codex-skills install bug-triage

# Install every published skill
npx codex-skills install-all

# Install one skill in a repository
npx codex-skills install bug-triage --dir .agents/skills
```

Run `npx codex-skills help` for the full command reference.

## Use

Codex discovers skills installed in `~/.agents/skills/` and repository-local
`.agents/skills/` directories. Invoke a skill explicitly with `$skill-name`,
or describe a request that matches its purpose.

Codex normally detects installed changes automatically. Restart it if a new or
updated skill does not appear.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for repository conventions. Run the same
checks as CI before opening a pull request:

```bash
python scripts/build_skills_json.py --check
python -m unittest discover -s scripts -p "test_*.py"
python scripts/validate_skills.py
python scripts/check_invisible_chars.py --all
npm ci --ignore-scripts --prefix cli
npm audit --omit=dev --prefix cli
npm test --prefix cli
```

Security reports: [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
