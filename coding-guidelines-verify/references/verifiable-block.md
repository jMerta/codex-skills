# `codex-guidelines` verifiable block (schema v1)

Each nested `AGENTS.md` that should be machine-checkable contains exactly one block:

```codex-guidelines
{
  "version": 1,
  "format": {
    "autofix": true,
    "commands": ["<cmd with optional {files}>"],
    "windows": ["<optional override>"],
    "posix": ["<optional override>"]
  },
  "lint": { "commands": ["<cmd>"], "windows": [], "posix": [] },
  "test": { "commands": ["<cmd>"], "optional": true, "windows": [], "posix": [] },
  "rules": {
    "forbid_globs": ["<glob relative to this AGENTS.md dir>"],
    "forbid_regex": [{ "pattern": "<regex>", "message": "<why forbidden>" }]
  }
}
```

Notes:
- Commands run from the directory containing that `AGENTS.md`.
- `{files}` is replaced with the changed files in that scope (relative paths).

