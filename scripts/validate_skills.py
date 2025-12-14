from __future__ import annotations

import re
from pathlib import Path

import yaml


FRONTMATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.S)
MENTIONED_FILE_RE = re.compile(r"(?P<path>(?:references|scripts|assets)/[A-Za-z0-9][A-Za-z0-9_.\\/-]*)")


def validate_skill_file(path: Path) -> tuple[list[str], dict]:
    text = path.read_text(encoding="utf-8")
    match = FRONTMATTER_RE.match(text)
    if not match:
        return (["missing frontmatter block (--- ... --- at top of file)"], {})

    frontmatter = match.group(1)
    try:
        data = yaml.safe_load(frontmatter) or {}
    except Exception as exc:  # noqa: BLE001
        return ([f"invalid YAML: {exc}"], {})

    errors: list[str] = []
    for key, limit in (("name", 100), ("description", 500)):
        value = data.get(key)
        if not isinstance(value, str) or not value.strip():
            errors.append(f"missing/empty {key}")
            continue
        if "\n" in value or "\r" in value:
            errors.append(f"{key} must be single-line")
        if len(value) > limit:
            errors.append(f"{key} too long ({len(value)}>{limit})")

    name_value = data.get("name")
    if isinstance(name_value, str) and name_value.strip() and name_value != path.parent.name:
        errors.append(f"name does not match folder ({name_value!r} != {path.parent.name!r})")

    skill_root = path.parent.resolve()
    body = text[match.end() :]
    for rel_path in sorted(set(MENTIONED_FILE_RE.findall(body))):
        normalized = rel_path.replace("\\", "/")
        referenced_rel = Path(normalized)
        if referenced_rel.is_absolute() or ".." in referenced_rel.parts:
            errors.append(f"invalid referenced path {rel_path}")
            continue

        referenced = (path.parent / referenced_rel).resolve()
        try:
            referenced.relative_to(skill_root)
        except ValueError:
            errors.append(f"invalid referenced path {rel_path} (escapes skill dir)")
            continue

        if not referenced.exists():
            errors.append(f"missing referenced file {rel_path}")
    return (errors, data)


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    errors_found: list[str] = []
    seen_names: dict[str, Path] = {}

    for skill_dir in sorted([p for p in repo_root.iterdir() if p.is_dir()]):
        skill_md = skill_dir / "SKILL.md"
        if not skill_md.exists():
            continue
        errors, data = validate_skill_file(skill_md)
        for err in errors:
            errors_found.append(f"{skill_md.relative_to(repo_root)}: {err}")

        name_value = data.get("name")
        if isinstance(name_value, str) and name_value.strip():
            previous = seen_names.get(name_value)
            if previous is not None and previous != skill_md:
                errors_found.append(
                    f"{skill_md.relative_to(repo_root)}: duplicate name {name_value!r} (also {previous.relative_to(repo_root)})"
                )
            else:
                seen_names[name_value] = skill_md

    if errors_found:
        print("Skill validation errors detected:")
        for err in errors_found:
            print(f"- {err}")
        return 1

    print("OK: all SKILL.md files validated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
