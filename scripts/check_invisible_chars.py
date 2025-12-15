from __future__ import annotations

import argparse
import os
import re
import shlex
import subprocess
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


ALLOWED_WHITESPACE = {" ", "\t", "\n", "\r"}
VARIATION_SELECTOR_RANGES = [
    # Variation Selectors (VS1..VS16)
    (0xFE00, 0xFE0F),
    # Variation Selectors Supplement (VS17..VS256)
    (0xE0100, 0xE01EF),
]


@dataclass(frozen=True)
class Finding:
    path: str
    line: int
    col: int
    codepoint: int
    name: str
    category: str
    rendered_line: str


def _run_git(repo_root: Path, args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=str(repo_root),
        capture_output=True,
        text=True,
    )


def _repo_root() -> Path:
    cwd = Path.cwd().resolve()
    proc = _run_git(cwd, ["rev-parse", "--show-toplevel"])
    if proc.returncode != 0:
        return cwd
    return Path(proc.stdout.strip()).resolve()


def _is_in_variation_selector_range(codepoint: int) -> bool:
    return any(start <= codepoint <= end for start, end in VARIATION_SELECTOR_RANGES)


def _is_forbidden_char(ch: str) -> bool:
    if ch in ALLOWED_WHITESPACE:
        return False

    # "Weird whitespace" (NBSP, thin spaces, line/paragraph separators, etc.)
    if ch.isspace():
        return True

    codepoint = ord(ch)
    if _is_in_variation_selector_range(codepoint):
        return True

    # Most invisible/control/format chars are in these categories.
    category = unicodedata.category(ch)
    if category in {"Cc", "Cf"}:
        return True

    # A few known "invisible" marks are not Cf.
    if codepoint in {0x034F}:  # COMBINING GRAPHEME JOINER
        return True

    return False


def _render_line(line: str, max_len: int = 240) -> str:
    rendered = line.encode("unicode_escape", errors="backslashreplace").decode("ascii", errors="replace")
    if len(rendered) > max_len:
        return rendered[: max_len - 3] + "..."
    return rendered


def _scan_text(*, path: str, text: str, start_line: int = 1) -> list[Finding]:
    findings: list[Finding] = []
    for i, line in enumerate(text.splitlines(), start=start_line):
        for j, ch in enumerate(line, start=1):
            if not _is_forbidden_char(ch):
                continue
            codepoint = ord(ch)
            findings.append(
                Finding(
                    path=path,
                    line=i,
                    col=j,
                    codepoint=codepoint,
                    name=unicodedata.name(ch, "UNKNOWN"),
                    category=unicodedata.category(ch),
                    rendered_line=_render_line(line),
                )
            )
    return findings


def _is_probably_binary(data: bytes) -> bool:
    if b"\x00" in data:
        return True
    # Heuristic: if it contains many non-text bytes, treat as binary.
    sample = data[:4096]
    if not sample:
        return False
    nontext = sum(1 for b in sample if b < 9 or (13 < b < 32) or b == 127)
    return (nontext / len(sample)) > 0.3


def _scan_file(repo_root: Path, file_path: Path) -> list[Finding]:
    rel = file_path.resolve().relative_to(repo_root).as_posix()
    try:
        data = file_path.read_bytes()
    except OSError:
        return []

    if _is_probably_binary(data):
        return []

    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        # Don’t guess encodings; replace errors so we can still scan the rest.
        text = data.decode("utf-8", errors="replace")

    return _scan_text(path=rel, text=text)


_DIFF_HEADER_RE = re.compile(r"^diff --git (?P<old>.+?) (?P<new>.+)$")
_HUNK_RE = re.compile(r"^@@ -\\d+(?:,\\d+)? \\+(?P<start>\\d+)(?:,(?P<count>\\d+))? @@")


def _parse_diff_added_lines(diff_text: str) -> list[tuple[str, int, str]]:
    """
    Returns (path, new_line_number, added_line_text) for each added line in the diff.
    Expects unified diffs (git diff) and works best with -U0 and --no-prefix.
    """
    current_path: str | None = None
    new_line: int | None = None
    rows: list[tuple[str, int, str]] = []

    for raw in diff_text.splitlines():
        m = _DIFF_HEADER_RE.match(raw)
        if m:
            # Paths may be quoted; use shlex to parse safely.
            parts = shlex.split(raw)
            if len(parts) >= 4:
                current_path = parts[3]
            else:
                current_path = m.group("new")
            new_line = None
            continue

        m = _HUNK_RE.match(raw)
        if m:
            new_line = int(m.group("start"))
            continue

        if current_path is None or new_line is None:
            continue

        if raw.startswith("+++ ") or raw.startswith("--- "):
            continue
        if raw.startswith("\\ No newline at end of file"):
            continue

        if raw.startswith("+"):
            rows.append((current_path, new_line, raw[1:]))
            new_line += 1
            continue
        if raw.startswith("-"):
            continue
        if raw.startswith(" "):
            new_line += 1

    return rows


def _collect_untracked(repo_root: Path) -> list[Path]:
    proc = _run_git(repo_root, ["ls-files", "--others", "--exclude-standard"])
    if proc.returncode != 0:
        return []
    files: list[Path] = []
    for line in proc.stdout.splitlines():
        rel = line.strip()
        if not rel:
            continue
        p = (repo_root / rel).resolve()
        if p.is_file():
            files.append(p)
    return files


def _collect_tracked_files(repo_root: Path) -> list[Path]:
    proc = _run_git(repo_root, ["ls-files"])
    if proc.returncode != 0:
        return []
    files: list[Path] = []
    for line in proc.stdout.splitlines():
        rel = line.strip()
        if not rel:
            continue
        p = (repo_root / rel).resolve()
        if p.is_file():
            files.append(p)
    return files


def _scan_git_diff(repo_root: Path, diff_args: list[str]) -> list[Finding]:
    proc = _run_git(repo_root, ["diff", "--no-color", "--no-ext-diff", "--no-prefix", "-U0", *diff_args])
    if proc.returncode != 0:
        # `git diff` returns 1 for differences only with some flags, but here it should be 0;
        # treat errors as fatal.
        raise RuntimeError(proc.stderr.strip() or "git diff failed")

    findings: list[Finding] = []
    for path, line_no, added_line in _parse_diff_added_lines(proc.stdout):
        for f in _scan_text(path=path, text=added_line, start_line=line_no):
            # `_scan_text` assumes the whole input is one "file"; adapt line/col for single-line scan.
            findings.append(
                Finding(
                    path=f.path,
                    line=line_no,
                    col=f.col,
                    codepoint=f.codepoint,
                    name=f.name,
                    category=f.category,
                    rendered_line=_render_line(added_line),
                )
            )
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Detect invisible/suspicious characters in what you're about to commit (or in the whole repo)."
    )
    parser.add_argument("--all", action="store_true", help="Scan all tracked files (repo-wide).")
    parser.add_argument("--staged", action="store_true", help="Scan staged changes only (git diff --cached).")
    parser.add_argument(
        "--base",
        metavar="REF",
        help="Scan added lines between REF...HEAD (useful for CI/PR checks).",
    )
    args = parser.parse_args()

    repo_root = _repo_root()
    findings: list[Finding] = []

    try:
        if args.all:
            for p in _collect_tracked_files(repo_root):
                findings.extend(_scan_file(repo_root, p))
        elif args.base:
            findings.extend(_scan_git_diff(repo_root, [f"{args.base}...HEAD"]))
        elif args.staged:
            findings.extend(_scan_git_diff(repo_root, ["--cached"]))
            for p in _collect_untracked(repo_root):
                findings.extend(_scan_file(repo_root, p))
        else:
            # Default: staged + unstaged + untracked.
            findings.extend(_scan_git_diff(repo_root, ["--cached"]))
            findings.extend(_scan_git_diff(repo_root, []))
            for p in _collect_untracked(repo_root):
                findings.extend(_scan_file(repo_root, p))
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    if not findings:
        print("OK: no invisible/suspicious characters found.")
        return 0

    print("FAIL: invisible/suspicious characters found:")
    for f in findings:
        print(
            f"- {f.path}:{f.line}:{f.col} U+{f.codepoint:04X} {f.name} ({f.category}) :: {f.rendered_line}"
        )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

