from __future__ import annotations

import argparse
import json
import os
import re
import shlex
import subprocess
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


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


def _is_noncharacter(codepoint: int) -> bool:
    # Permanently reserved noncharacters.
    if 0xFDD0 <= codepoint <= 0xFDEF:
        return True
    if (codepoint & 0xFFFF) in {0xFFFE, 0xFFFF}:
        return True
    return False


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

    # Surrogates / private-use / noncharacters are suspicious in repos and PR metadata.
    if category in {"Cs", "Co"}:
        return True
    if _is_noncharacter(codepoint):
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


def _scan_path_string(rel_path: str) -> list[Finding]:
    # Scan the filename itself (invisible chars in paths can be used for deception).
    return _scan_text(path="path[" + rel_path + "]", text=rel_path, start_line=1)


def _scan_file(repo_root: Path, file_path: Path) -> list[Finding]:
    rel = file_path.resolve().relative_to(repo_root).as_posix()
    findings: list[Finding] = []
    findings.extend(_scan_path_string(rel))
    try:
        data = file_path.read_bytes()
    except OSError:
        return findings

    if _is_probably_binary(data):
        return findings

    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        # Don't guess encodings; replace errors so we can still scan the rest.
        text = data.decode("utf-8", errors="replace")

    findings.extend(_scan_text(path=rel, text=text))
    return findings


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
    scanned_paths: set[str] = set()
    for path, line_no, added_line in _parse_diff_added_lines(proc.stdout):
        if path not in scanned_paths:
            findings.extend(_scan_path_string(path))
            scanned_paths.add(path)
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


def _scan_commit_message(repo_root: Path, sha: str) -> list[Finding]:
    proc = _run_git(repo_root, ["show", "-s", "--format=%B", sha])
    if proc.returncode != 0:
        return []
    return _scan_text(path=f"commit[{sha}]", text=proc.stdout, start_line=1)


def _git_rev_list(repo_root: Path, rev_range: str) -> list[str] | None:
    proc = _run_git(repo_root, ["rev-list", "--reverse", rev_range])
    if proc.returncode != 0:
        return None
    return [line.strip() for line in proc.stdout.splitlines() if line.strip()]


def _github_link_next(link_header: str | None) -> str | None:
    if not link_header:
        return None
    # Example: <https://api.github.com/...&page=2>; rel="next", <...>; rel="last"
    for part in link_header.split(","):
        part = part.strip()
        if 'rel="next"' not in part:
            continue
        m = re.match(r'^<([^>]+)>;\s*rel="next"$', part)
        if m:
            return m.group(1)
    return None


def _github_api_get_json(url: str, token: str) -> tuple[Any, str | None]:
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:  # noqa: S310
            raw = resp.read()
            data = json.loads(raw.decode("utf-8", errors="replace"))
            next_url = _github_link_next(resp.headers.get("Link"))
            return (data, next_url)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return (None, None)


def _github_pr_commits_messages(commits_url: str, token: str) -> list[tuple[str, str]]:
    commits: list[tuple[str, str]] = []
    url = commits_url
    parsed = urllib.parse.urlsplit(url)
    query = urllib.parse.parse_qs(parsed.query)
    query.setdefault("per_page", ["100"])
    url = urllib.parse.urlunsplit(parsed._replace(query=urllib.parse.urlencode(query, doseq=True)))

    next_url: str | None = url
    while next_url:
        data, next_url = _github_api_get_json(next_url, token)
        if not isinstance(data, list):
            break
        for item in data:
            if not isinstance(item, dict):
                continue
            sha = item.get("sha")
            commit = item.get("commit")
            message = None
            if isinstance(commit, dict):
                message = commit.get("message")
            if isinstance(sha, str) and isinstance(message, str):
                commits.append((sha, message))
    return commits


def _scan_github_event(repo_root: Path, event_path: Path) -> list[Finding]:
    try:
        payload = json.loads(event_path.read_text(encoding="utf-8", errors="replace"))
    except (OSError, json.JSONDecodeError):
        return [Finding(path="github[event]", line=1, col=1, codepoint=0, name="INVALID", category="ERR", rendered_line="unable to read/parse GitHub event payload")]

    findings: list[Finding] = []

    # Pull request (scan title/body and the commit messages in the PR).
    pr = payload.get("pull_request") if isinstance(payload, dict) else None
    if isinstance(pr, dict):
        title = pr.get("title") or ""
        body = pr.get("body") or ""
        if isinstance(title, str) and title:
            findings.extend(_scan_text(path="pr[title]", text=title, start_line=1))
        if isinstance(body, str) and body:
            findings.extend(_scan_text(path="pr[body]", text=body, start_line=1))

        base_sha = None
        head_sha = None
        base = pr.get("base")
        head = pr.get("head")
        if isinstance(base, dict) and isinstance(base.get("sha"), str):
            base_sha = base.get("sha")
        if isinstance(head, dict) and isinstance(head.get("sha"), str):
            head_sha = head.get("sha")

        # Prefer local git (no network); fall back to GitHub API if needed.
        scanned_commits = False
        if isinstance(base_sha, str) and isinstance(head_sha, str):
            shas = _git_rev_list(repo_root, f"{base_sha}..{head_sha}")
            if shas:
                for sha in shas:
                    findings.extend(_scan_commit_message(repo_root, sha))
                scanned_commits = True

        if not scanned_commits:
            token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
            commits_url = pr.get("commits_url")
            if isinstance(token, str) and token and isinstance(commits_url, str) and commits_url:
                commits = _github_pr_commits_messages(commits_url, token)
                for sha, msg in commits:
                    findings.extend(_scan_text(path=f"commit[{sha}]", text=msg, start_line=1))
                scanned_commits = bool(commits)

        if not scanned_commits:
            findings.append(
                Finding(
                    path="pr[commits]",
                    line=1,
                    col=1,
                    codepoint=0,
                    name="SKIPPED",
                    category="WARN",
                    rendered_line="unable to scan PR commit messages (missing git history and no API token)",
                )
            )
        return findings

    # Push event (scan commit messages included in the payload).
    if isinstance(payload, dict) and isinstance(payload.get("commits"), list):
        commits = payload.get("commits")
        seen: set[str] = set()
        for c in commits:
            if not isinstance(c, dict):
                continue
            sha = c.get("id")
            msg = c.get("message")
            if not isinstance(sha, str) or not isinstance(msg, str):
                continue
            if sha in seen:
                continue
            seen.add(sha)
            findings.extend(_scan_text(path=f"commit[{sha}]", text=msg, start_line=1))
        return findings

    return findings


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Detect invisible/suspicious characters in what you're about to commit (or in the whole repo)."
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--all", action="store_true", help="Scan all tracked files (repo-wide).")
    mode.add_argument("--staged", action="store_true", help="Scan staged changes only (git diff --cached).")
    mode.add_argument(
        "--base",
        metavar="REF",
        help="Scan added lines between REF...HEAD (useful for CI/PR checks).",
    )
    parser.add_argument(
        "--commit-range",
        metavar="RANGE",
        help="Scan git commit messages in RANGE (e.g., origin/main..HEAD).",
    )
    parser.add_argument(
        "--github-event",
        action="store_true",
        help="Also scan GitHub event payload for PR title/body and commit messages (CI).",
    )
    parser.add_argument(
        "--github-event-path",
        metavar="PATH",
        help="Override the GitHub event JSON path (default: $GITHUB_EVENT_PATH).",
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

        if args.commit_range:
            shas = _git_rev_list(repo_root, args.commit_range)
            if shas is None:
                raise RuntimeError(f"git rev-list failed for range: {args.commit_range}")
            for sha in shas:
                findings.extend(_scan_commit_message(repo_root, sha))

        if args.github_event:
            event_path_str = args.github_event_path or os.environ.get("GITHUB_EVENT_PATH")
            if not event_path_str:
                raise RuntimeError("--github-event requires $GITHUB_EVENT_PATH or --github-event-path")
            findings.extend(_scan_github_event(repo_root, Path(event_path_str)))
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    if not findings:
        print("OK: no invisible/suspicious characters found.")
        return 0

    print("FAIL: invisible/suspicious characters found:")
    for f in findings:
        rendered_source = _render_line(f.path, max_len=240)
        print(
            f"- {rendered_source}:{f.line}:{f.col} U+{f.codepoint:04X} {f.name} ({f.category}) :: {f.rendered_line}"
        )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
