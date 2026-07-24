#!/usr/bin/env python3
"""Download and stage public-safe Codex skin packs."""

from __future__ import annotations

import argparse
import datetime as dt
import http.client
import json
import os
import shutil
import sys
import tempfile
import urllib.error
import urllib.request
import zipfile
from pathlib import Path


RELEASE_BASE = "https://github.com/ChannelerH/codex-skin-packs/releases/download/v0.1.0"
MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024
MAX_ZIP_MEMBERS = 64
MAX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024

PACKS = {
    "caishen-readable": "Low-strain light fortune skin.",
    "caishen-lite": "Soft fortune skin with readable working areas.",
    "caishen-max": "Brighter fortune skin for short immersive sessions.",
    "global-founder-bright": "Bright international growth workspace skin.",
    "export-night": "Dark export-ops skin.",
    "mythic-guardian-noir": "Dark mythic focus skin.",
}


def fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def remove_path(path: Path) -> None:
    if not path.exists():
        return
    if path.is_dir():
        shutil.rmtree(path)
    else:
        path.unlink()


def safe_extract(zip_path: Path, destination: Path) -> None:
    destination = destination.resolve()
    try:
        with zipfile.ZipFile(zip_path) as archive:
            members = archive.infolist()
            if len(members) > MAX_ZIP_MEMBERS:
                fail(f"zip has too many entries: {len(members)} > {MAX_ZIP_MEMBERS}")

            total_size = 0
            for member in members:
                total_size += member.file_size
                if total_size > MAX_UNCOMPRESSED_BYTES:
                    fail(
                        "zip uncompressed size exceeds limit: "
                        f"{total_size} > {MAX_UNCOMPRESSED_BYTES} bytes"
                    )
                target = (destination / member.filename).resolve()
                if destination != target and destination not in target.parents:
                    fail(f"unsafe zip path: {member.filename}")
            archive.extractall(destination)
    except zipfile.BadZipFile as exc:
        fail(f"downloaded archive is not a valid zip file: {exc}")


def locate_pack_root(destination: Path) -> Path:
    candidates = []
    for path in [destination, *destination.iterdir()]:
        if path.is_dir() and (path / "theme.json").is_file() and (path / "background.png").is_file():
            candidates.append(path)
    if not candidates:
        fail("staged pack must contain theme.json and background.png")
    return candidates[0]


def validate_theme(pack_root: Path) -> None:
    theme_path = pack_root / "theme.json"
    try:
        json.loads(theme_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"theme.json is invalid JSON: {exc}")


def download(url: str, destination: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": "codex-skin-pack-installer"})
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            if response.status >= 400:
                fail(f"download failed with HTTP {response.status}")
            content_length = response.headers.get("Content-Length")
            if content_length:
                try:
                    content_bytes = int(content_length)
                except ValueError:
                    content_bytes = None
                if content_bytes is not None and content_bytes > MAX_DOWNLOAD_BYTES:
                    fail(f"download is too large: {content_bytes} > {MAX_DOWNLOAD_BYTES} bytes")
            with destination.open("wb") as handle:
                downloaded = 0
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    downloaded += len(chunk)
                    if downloaded > MAX_DOWNLOAD_BYTES:
                        fail(f"download exceeded {MAX_DOWNLOAD_BYTES} bytes")
                    handle.write(chunk)
    except urllib.error.HTTPError as exc:
        fail(f"download failed with HTTP {exc.code}")
    except (urllib.error.URLError, TimeoutError, OSError, http.client.IncompleteRead) as exc:
        fail(f"download failed: {exc}")


def activate_replacement(replacement: Path, destination: Path) -> None:
    backup = None
    if destination.exists():
        stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%d%H%M%S%f")
        backup = destination.parent / f".{destination.name}.backup-{os.getpid()}-{stamp}"
        destination.rename(backup)

    try:
        replacement.rename(destination)
    except OSError as exc:
        remove_path(replacement)
        if backup is not None and backup.exists():
            backup.rename(destination)
        fail(f"failed to activate staged pack: {exc}")

    if backup is not None:
        remove_path(backup)


def stage_pack(slug: str, output_dir: Path) -> Path:
    if slug not in PACKS:
        fail(f"unknown pack '{slug}'. Run with --list to see available packs.")

    url = f"{RELEASE_BASE}/{slug}.zip"
    output_root = output_dir.expanduser()
    destination = output_root / slug

    with tempfile.TemporaryDirectory(prefix="codex-skin-pack-") as temp_dir:
        temp_root = Path(temp_dir)
        zip_path = temp_root / f"{slug}.zip"
        staging = temp_root / "staged"
        staging.mkdir()
        download(url, zip_path)
        safe_extract(zip_path, staging)

        pack_root = locate_pack_root(staging)
        validate_theme(pack_root)

        replacement = None
        try:
            output_root.mkdir(parents=True, exist_ok=True)
            replacement = Path(tempfile.mkdtemp(prefix=f".{slug}.replacement-", dir=output_root))

            if pack_root == staging:
                replacement_pack_root = replacement
                final_pack_root = destination
                for child in pack_root.iterdir():
                    shutil.move(str(child), replacement_pack_root / child.name)
            else:
                replacement_pack_root = replacement / pack_root.name
                final_pack_root = destination / pack_root.name
                shutil.move(str(pack_root), replacement_pack_root)

            manifest = {
                "slug": slug,
                "source": url,
                "stagedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
                "packRoot": str(final_pack_root),
            }
            (replacement / "source.json").write_text(
                json.dumps(manifest, indent=2) + "\n",
                encoding="utf-8",
            )
            activate_replacement(replacement, destination)
        except OSError as exc:
            if replacement is not None:
                remove_path(replacement)
            fail(f"failed to stage pack replacement: {exc}")

    return final_pack_root


def main() -> None:
    parser = argparse.ArgumentParser(description="Download and stage public-safe Codex skin packs.")
    parser.add_argument("slug", nargs="?", help="Pack slug to stage")
    parser.add_argument(
        "--out",
        default=os.path.expanduser("~/.codexthemes/packs"),
        help="Output directory, default: ~/.codexthemes/packs",
    )
    parser.add_argument("--list", action="store_true", help="List available packs")
    args = parser.parse_args()

    if args.list:
        for slug, description in PACKS.items():
            print(f"{slug}\t{description}")
        return

    if not args.slug:
        fail("missing pack slug. Run with --list to see available packs.")

    pack_root = stage_pack(args.slug, Path(args.out))
    print(f"staged: {pack_root}")
    print("next: apply with your active Codex theme manager, then verify readability and restore path.")


if __name__ == "__main__":
    main()
