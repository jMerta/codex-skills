from __future__ import annotations

import argparse
import fnmatch
import json
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


CODE_FENCE_RE = re.compile(r"```codex-guidelines\s*\r?\n(.*?)\r?\n```", re.DOTALL)


@dataclass(frozen=True)
class CommandResult:
    command: str
    returncode: int
    stdout: str
    stderr: str


def _run_process(args: list[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        cwd=str(cwd),
        capture_output=True,
        text=True,
    )


def _git(repo_root: Path, args: list[str]) -> str | None:
    proc = _run_process(["git", *args], cwd=repo_root)
    if proc.returncode != 0:
        return None
    return proc.stdout


def _repo_root() -> Path:
    cwd = Path.cwd().resolve()
    out = _git(cwd, ["rev-parse", "--show-toplevel"])
    if out is None:
        return cwd
    return Path(out.strip()).resolve()


def _changed_files(repo_root: Path, all_files: bool) -> list[Path]:
    if all_files:
        out = _git(repo_root, ["ls-files"]) or ""
        candidates = [line.strip() for line in out.splitlines() if line.strip()]
        return [repo_root / p for p in candidates]

    paths: set[str] = set()
    for args in (
        ["diff", "--name-only", "--diff-filter=ACMRTUXB"],
        ["diff", "--name-only", "--diff-filter=ACMRTUXB", "--cached"],
        ["ls-files", "--others", "--exclude-standard"],
    ):
        out = _git(repo_root, args) or ""
        for line in out.splitlines():
            line = line.strip()
            if line:
                paths.add(line)

    files: list[Path] = []
    for rel in sorted(paths):
        full = (repo_root / rel).resolve()
        if full.is_file():
            files.append(full)
    return files


def _find_nearest_agents(repo_root: Path, file_path: Path) -> Path | None:
    current = file_path.parent.resolve()
    while True:
        candidate = current / "AGENTS.md"
        if candidate.is_file():
            return candidate
        if current == repo_root:
            return None
        current = current.parent


def _extract_guidelines_json(agents_path: Path) -> tuple[dict[str, Any] | None, str | None]:
    text = agents_path.read_text(encoding="utf-8", errors="replace")
    match = CODE_FENCE_RE.search(text)
    if not match:
        return (None, "missing ```codex-guidelines fenced block")
    raw = match.group(1).strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        return (None, f"invalid JSON in codex-guidelines block: {exc}")
    if not isinstance(data, dict):
        return (None, "codex-guidelines JSON must be an object")
    if data.get("version") != 1:
        return (None, "unsupported codex-guidelines version (expected 1)")
    return (data, None)


def _shell_prefix() -> list[str]:
    if os.name == "nt":
        return ["powershell", "-NoProfile", "-NonInteractive", "-Command"]
    shell = "bash" if shutil.which("bash") else "sh"
    return [shell, "-lc"]


def _quote_paths(paths: Iterable[str]) -> str:
    if os.name == "nt":
        # PowerShell single-quote escaping
        quoted = []
        for p in paths:
            quoted.append("'" + p.replace("'", "''") + "'")
        return " ".join(quoted)
    import shlex

    return " ".join(shlex.quote(p) for p in paths)


def _select_commands(block: dict[str, Any], key: str) -> list[str]:
    section = block.get(key) or {}
    if not isinstance(section, dict):
        return []

    if os.name == "nt":
        override = section.get("windows")
    else:
        override = section.get("posix")

    if isinstance(override, list) and all(isinstance(x, str) for x in override) and override:
        return override

    commands = section.get("commands")
    if isinstance(commands, list) and all(isinstance(x, str) for x in commands):
        return commands
    return []


def _run_commands(
    *,
    commands: list[str],
    cwd: Path,
    changed_rel_files: list[str],
) -> list[CommandResult]:
    results: list[CommandResult] = []
    files_arg = _quote_paths(changed_rel_files)
    prefix = _shell_prefix()

    for cmd in commands:
        expanded = cmd.replace("{files}", files_arg)
        proc = _run_process([*prefix, expanded], cwd=cwd)
        results.append(
            CommandResult(
                command=expanded,
                returncode=proc.returncode,
                stdout=proc.stdout,
                stderr=proc.stderr,
            )
        )
    return results


def _matches_any_glob(path: str, globs: list[str]) -> bool:
    return any(fnmatch.fnmatch(path, pat) for pat in globs)


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify nested AGENTS.md coding guidelines (codex-guidelines blocks).")
    parser.add_argument("--all", action="store_true", help="Verify all tracked files (otherwise changed files only).")
    parser.add_argument("--no-fix", action="store_true", help="Do not auto-fix formatting (skip format commands).")
    parser.add_argument("--format-only", action="store_true", help="Run formatting only (skip lint/tests/rules).")
    parser.add_argument("--skip-tests", action="store_true", help="Skip test commands even if configured.")
    parser.add_argument("--allow-unscoped", action="store_true", help="Do not fail when files have no scoped AGENTS.md.")
    args = parser.parse_args()

    repo_root = _repo_root()
    files = _changed_files(repo_root, all_files=args.all)
    if not files:
        print("No files to verify.")
        return 0

    by_agents: dict[Path | None, list[Path]] = {}
    for f in files:
        agents = _find_nearest_agents(repo_root, f)
        by_agents.setdefault(agents, []).append(f)

    failures: list[str] = []

    unscoped = by_agents.get(None, [])
    if unscoped:
        msg = "Missing scoped AGENTS.md for:\n" + "\n".join(f"- {p.relative_to(repo_root)}" for p in unscoped)
        if args.allow_unscoped:
            print(msg)
        else:
            failures.append(msg)

    for agents_path, scoped_files in sorted((k, v) for k, v in by_agents.items() if k is not None):
        assert agents_path is not None
        scope_root = agents_path.parent.resolve()
        rel_scope = agents_path.relative_to(repo_root)
        rel_files = []
        for p in scoped_files:
            try:
                rel_files.append(p.relative_to(scope_root).as_posix())
            except ValueError:
                # File is not under this scope root; skip it.
                continue

        block, err = _extract_guidelines_json(agents_path)
        if err is not None:
            failures.append(f"{rel_scope}: {err}")
            continue

        print(f"\n== Scope: {rel_scope} ==")

        # Rules: forbid globs + forbid regex (changed files only within scope)
        if not args.format_only:
            rules = block.get("rules") if isinstance(block, dict) else None
            if isinstance(rules, dict):
                forbid_globs = rules.get("forbid_globs")
                if isinstance(forbid_globs, list) and all(isinstance(x, str) for x in forbid_globs):
                    for rf in rel_files:
                        if _matches_any_glob(rf, forbid_globs):
                            failures.append(f"{rel_scope}: forbidden path matched ({rf})")

                forbid_regex = rules.get("forbid_regex")
                if isinstance(forbid_regex, list):
                    for entry in forbid_regex:
                        if isinstance(entry, str):
                            pattern = entry
                            message = "forbidden pattern matched"
                            path_globs: list[str] | None = None
                        elif isinstance(entry, dict):
                            pattern = entry.get("pattern")
                            message = entry.get("message") or "forbidden pattern matched"
                            path_globs = entry.get("paths")
                            if isinstance(path_globs, list) and all(isinstance(x, str) for x in path_globs):
                                path_globs = list(path_globs)
                            else:
                                path_globs = None
                        else:
                            continue

                        if not isinstance(pattern, str) or not pattern:
                            continue

                        try:
                            regex = re.compile(pattern)
                        except re.error as exc:
                            failures.append(f"{rel_scope}: invalid forbid_regex pattern {pattern!r}: {exc}")
                            continue

                        for rf in rel_files:
                            if path_globs is not None and not _matches_any_glob(rf, path_globs):
                                continue
                            abs_path = scope_root / rf
                            try:
                                text = abs_path.read_text(encoding="utf-8", errors="replace")
                            except OSError:
                                continue
                            if regex.search(text):
                                failures.append(f"{rel_scope}: {message} ({rf})")

        if not args.no_fix:
            format_cmds = _select_commands(block, "format")
            if format_cmds:
                print("- format (auto-fix)")
                results = _run_commands(commands=format_cmds, cwd=scope_root, changed_rel_files=rel_files)
                for r in results:
                    if r.returncode != 0:
                        failures.append(f"{rel_scope}: format failed: {r.command}")
                        if r.stdout.strip():
                            print(r.stdout.rstrip())
                        if r.stderr.strip():
                            print(r.stderr.rstrip(), file=sys.stderr)
                        break

        if args.format_only:
            continue

        lint_cmds = _select_commands(block, "lint")
        if lint_cmds:
            print("- lint")
            results = _run_commands(commands=lint_cmds, cwd=scope_root, changed_rel_files=rel_files)
            for r in results:
                if r.returncode != 0:
                    failures.append(f"{rel_scope}: lint failed: {r.command}")
                    if r.stdout.strip():
                        print(r.stdout.rstrip())
                    if r.stderr.strip():
                        print(r.stderr.rstrip(), file=sys.stderr)
                    break

        if not args.skip_tests:
            test_section = block.get("test") if isinstance(block, dict) else None
            optional = False
            if isinstance(test_section, dict) and isinstance(test_section.get("optional"), bool):
                optional = bool(test_section.get("optional"))

            test_cmds = _select_commands(block, "test")
            if test_cmds:
                print("- test")
                results = _run_commands(commands=test_cmds, cwd=scope_root, changed_rel_files=rel_files)
                for r in results:
                    if r.returncode != 0:
                        if optional:
                            print(f"  (optional) test failed: {r.command}")
                        else:
                            failures.append(f"{rel_scope}: test failed: {r.command}")
                        if r.stdout.strip():
                            print(r.stdout.rstrip())
                        if r.stderr.strip():
                            print(r.stderr.rstrip(), file=sys.stderr)
                        break

    if failures:
        print("\nFAIL:")
        for f in failures:
            print(f"- {f}")
        return 1

    print("\nOK: guidelines verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

