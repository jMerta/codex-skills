from __future__ import annotations

import re
from pathlib import Path

try:
    import yaml
except ModuleNotFoundError as exc:
    raise SystemExit("PyYAML is required: python -m pip install pyyaml") from exc


FRONTMATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.S)
SKILL_NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
MENTIONED_FILE_RE = re.compile(r"(?P<path>(?:references|scripts|assets)/[A-Za-z0-9][A-Za-z0-9_.\\/-]*)")


def load_mapping(text: str, label: str) -> tuple[dict, list[str]]:
    try:
        data = yaml.safe_load(text)
    except yaml.YAMLError as exc:
        return {}, [f"invalid YAML in {label}: {exc}"]
    if not isinstance(data, dict):
        return {}, [f"{label} must be a YAML mapping"]
    return data, []


def validate_openai_yaml(skill_dir: Path, name: str) -> list[str]:
    path = skill_dir / "agents" / "openai.yaml"
    if not path.is_file():
        return ["missing agents/openai.yaml"]

    data, errors = load_mapping(path.read_text(encoding="utf-8"), "agents/openai.yaml")
    interface = data.get("interface")
    if not isinstance(interface, dict):
        return errors + ["agents/openai.yaml: missing interface mapping"]

    display_name = interface.get("display_name")
    if not isinstance(display_name, str) or not display_name.strip():
        errors.append("agents/openai.yaml: display_name must be a non-empty string")

    short_description = interface.get("short_description")
    if not isinstance(short_description, str) or not 25 <= len(short_description.strip()) <= 64:
        errors.append("agents/openai.yaml: short_description must be 25-64 characters")

    default_prompt = interface.get("default_prompt")
    if not isinstance(default_prompt, str) or f"${name}" not in default_prompt:
        errors.append(f"agents/openai.yaml: default_prompt must mention ${name}")

    return errors


def validate_skill_file(path: Path) -> tuple[list[str], dict]:
    text = path.read_text(encoding="utf-8")
    match = FRONTMATTER_RE.match(text)
    if not match:
        return ["missing frontmatter block (--- ... --- at top of file)"], {}

    data, errors = load_mapping(match.group(1), "frontmatter")
    required_keys = {"name", "description"}
    missing_keys = sorted(required_keys - set(data))
    extra_keys = sorted(set(data) - required_keys)
    if missing_keys:
        errors.append(f"missing frontmatter keys: {', '.join(missing_keys)}")
    if extra_keys:
        errors.append(f"unsupported frontmatter keys: {', '.join(extra_keys)}")

    name = data.get("name")
    description = data.get("description")

    if not isinstance(name, str) or not name:
        errors.append("name must be a non-empty string")
    else:
        if "\n" in name or "\r" in name:
            errors.append("name must be single-line")
        if len(name) > 64:
            errors.append(f"name too long ({len(name)}>64)")
        if not SKILL_NAME_RE.fullmatch(name):
            errors.append("name must use lowercase letters, digits, and single hyphens")
        if name != path.parent.name:
            errors.append(f"name does not match folder ({name!r} != {path.parent.name!r})")

    if not isinstance(description, str) or not description.strip():
        errors.append("description must be a non-empty string")
    else:
        if "\n" in description or "\r" in description:
            errors.append("description must be single-line")
        if not description.startswith("Use when the user "):
            errors.append("description must start with 'Use when the user' and state invocation triggers")
        if len(description) > 500:
            errors.append(f"description too long ({len(description)}>500)")

    body = text[match.end() :]
    body_lines = len(body.splitlines())
    if body_lines >= 500:
        errors.append(f"body must be shorter than 500 lines ({body_lines})")

    skill_root = path.parent.resolve()
    for rel_path in sorted(set(MENTIONED_FILE_RE.findall(body))):
        referenced_rel = Path(rel_path.replace("\\", "/"))
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

    if isinstance(name, str) and name:
        errors.extend(validate_openai_yaml(path.parent, name))

    return errors, data


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    errors_found: list[str] = []
    seen_names: dict[str, Path] = {}

    for skill_dir in sorted(path for path in repo_root.iterdir() if path.is_dir()):
        skill_md = skill_dir / "SKILL.md"
        if not skill_md.exists():
            continue
        errors, data = validate_skill_file(skill_md)
        for error in errors:
            errors_found.append(f"{skill_md.relative_to(repo_root)}: {error}")

        name = data.get("name")
        if isinstance(name, str) and name:
            previous = seen_names.get(name)
            if previous is not None:
                errors_found.append(
                    f"{skill_md.relative_to(repo_root)}: duplicate name {name!r} "
                    f"(also {previous.relative_to(repo_root)})"
                )
            else:
                seen_names[name] = skill_md

    if errors_found:
        print("Skill validation errors detected:")
        for error in errors_found:
            print(f"- {error}")
        return 1

    print(f"OK: {len(seen_names)} skills validated with agents/openai.yaml metadata.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
