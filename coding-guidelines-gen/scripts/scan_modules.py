from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


EXCLUDED_DIRS = {
    ".git",
    ".hg",
    ".svn",
    ".idea",
    ".vscode",
    ".gradle",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".tox",
    "node_modules",
    "dist",
    "build",
    "out",
    "target",
    "bin",
    "obj",
    "coverage",
    ".venv",
    "venv",
}


MARKERS: dict[str, dict[str, str]] = {
    "package.json": {"language": "javascript/typescript", "kind": "node"},
    "pnpm-workspace.yaml": {"language": "javascript/typescript", "kind": "node-workspace"},
    "yarn.lock": {"language": "javascript/typescript", "kind": "node-lock"},
    "pyproject.toml": {"language": "python", "kind": "python"},
    "requirements.txt": {"language": "python", "kind": "python"},
    "setup.cfg": {"language": "python", "kind": "python"},
    "go.mod": {"language": "go", "kind": "go"},
    "go.work": {"language": "go", "kind": "go-workspace"},
    "Cargo.toml": {"language": "rust", "kind": "rust"},
    "build.gradle": {"language": "java/kotlin", "kind": "gradle"},
    "build.gradle.kts": {"language": "java/kotlin", "kind": "gradle"},
    "pom.xml": {"language": "java/kotlin", "kind": "maven"},
    "Gemfile": {"language": "ruby", "kind": "ruby"},
    "composer.json": {"language": "php", "kind": "php"},
}


@dataclass(frozen=True)
class Module:
    path: str
    markers: list[str]
    languages: list[str]
    kinds: list[str]


def iter_candidate_dirs(root: Path) -> Iterable[Path]:
    for current, dirnames, filenames in os.walk(root, topdown=True):
        current_path = Path(current)
        dirnames[:] = [
            d
            for d in dirnames
            if d not in EXCLUDED_DIRS and not d.startswith(".") and not (current_path / d).is_symlink()
        ]
        yield current_path


def main() -> int:
    repo_root = Path.cwd().resolve()
    found: dict[Path, dict[str, set[str] | list[str]]] = {}

    for directory in iter_candidate_dirs(repo_root):
        try:
            entries = {p.name for p in directory.iterdir() if p.is_file()}
        except OSError:
            continue

        markers_here = sorted(set(entries).intersection(MARKERS.keys()))
        if not markers_here:
            continue

        languages = sorted({MARKERS[m]["language"] for m in markers_here})
        kinds = sorted({MARKERS[m]["kind"] for m in markers_here})
        found[directory] = {
            "markers": markers_here,
            "languages": set(languages),
            "kinds": set(kinds),
        }

    modules: list[Module] = []
    for path in sorted(found.keys()):
        rel = os.path.relpath(path, repo_root).replace("\\", "/")
        if rel == ".":
            rel = "."
        markers = list(found[path]["markers"])  # type: ignore[assignment]
        languages = sorted(found[path]["languages"])  # type: ignore[arg-type]
        kinds = sorted(found[path]["kinds"])  # type: ignore[arg-type]
        modules.append(Module(path=rel, markers=markers, languages=languages, kinds=kinds))

    top_level_hints: list[str] = []
    if any(m.path == "." for m in modules):
        for hint in ("apps", "packages", "services", "src", "backend", "frontend", "server", "client"):
            if (repo_root / hint).is_dir():
                top_level_hints.append(hint)

    payload = {
        "repo_root": str(repo_root),
        "modules": [m.__dict__ for m in modules],
        "notes": [
            "Module roots are inferred from common project marker files.",
            "If the only module is repo root, prefer placing AGENTS.md in a subdirectory that represents the app/module (e.g., src/ or apps/<name>/).",
        ],
        "top_level_hints": top_level_hints,
    }
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

