# `codex-guidelines` verifiable block (schema v1)

Place exactly one block in each nested `AGENTS.md` you want to be verifiable:

```codex-guidelines
{
  "version": 1,
  "format": {
    "autofix": true,
    "commands": ["..."],
    "windows": ["..."],
    "posix": ["..."]
  },
  "lint": { "commands": ["..."], "windows": [], "posix": [] },
  "test": { "commands": ["..."], "optional": true, "windows": [], "posix": [] },
  "rules": {
    "forbid_globs": ["..."],
    "forbid_regex": [{ "pattern": "...", "message": "..." }]
  }
}
```

Notes:
- Commands run from the directory containing that `AGENTS.md`.
- `{files}` is replaced with the changed files in that scope (relative paths).
