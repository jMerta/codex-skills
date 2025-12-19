#!/usr/bin/env python3
import json
import os
import re
from datetime import datetime, timezone

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
META_PATH = os.path.join(ROOT, "skills-meta.json")
OUT_PATH = os.path.join(ROOT, "skills.json")

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
NAME_RE = re.compile(r"^name:\s*(.+)$", re.MULTILINE)
DESC_RE = re.compile(r"^description:\s*(.+)$", re.MULTILINE)


def load_meta():
    if os.path.exists(META_PATH):
        with open(META_PATH, "r", encoding="utf-8") as handle:
            return json.load(handle)
    return {
        "version": "1.0.0",
        "defaults": {},
        "skills": {},
        "categories": {}
    }


def strip_quotes(value):
    if value is None:
        return value
    value = value.strip()
    if (value.startswith("\"") and value.endswith("\"")) or (value.startswith("'") and value.endswith("'")):
        return value[1:-1].strip()
    return value


def parse_frontmatter(path):
    with open(path, "r", encoding="utf-8") as handle:
        text = handle.read()
    match = FRONTMATTER_RE.match(text)
    if not match:
        return None
    frontmatter = match.group(1)
    name_match = NAME_RE.search(frontmatter)
    desc_match = DESC_RE.search(frontmatter)
    if not name_match or not desc_match:
        return None
    name = strip_quotes(name_match.group(1))
    desc = strip_quotes(desc_match.group(1))
    return name, desc


def build_skills_index():
    meta = load_meta()
    defaults = meta.get("defaults", {})
    overrides = meta.get("skills", {})
    category_meta = meta.get("categories", {})

    skills = []
    category_counts = {}

    for entry in sorted(os.listdir(ROOT)):
        entry_path = os.path.join(ROOT, entry)
        if not os.path.isdir(entry_path):
            continue
        skill_md = os.path.join(entry_path, "SKILL.md")
        if not os.path.exists(skill_md):
            continue

        parsed = parse_frontmatter(skill_md)
        if not parsed:
            continue

        name, description = parsed
        skill_meta = dict(defaults)
        skill_meta.update(overrides.get(name, {}))

        category = skill_meta.get("category", "development")
        category_counts[category] = category_counts.get(category, 0) + 1

        skill_entry = {
            "name": name,
            "description": description,
            "category": category,
            "author": skill_meta.get("author"),
            "source": skill_meta.get("source"),
            "license": skill_meta.get("license"),
            "path": entry,
            "featured": bool(skill_meta.get("featured", False)),
            "verified": bool(skill_meta.get("verified", False))
        }
        if "stars" in skill_meta:
            skill_entry["stars"] = skill_meta["stars"]
        if "downloads" in skill_meta:
            skill_entry["downloads"] = skill_meta["downloads"]

        skills.append(skill_entry)

    categories = []
    for category_id in sorted(category_counts.keys()):
        meta_entry = category_meta.get(category_id, {})
        name = meta_entry.get("name") or category_id.replace("-", " ").title()
        description = meta_entry.get("description", "")
        categories.append({
            "id": category_id,
            "name": name,
            "description": description,
            "count": category_counts[category_id]
        })

    output = {
        "version": meta.get("version", "1.0.0"),
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total": len(skills),
        "skills": sorted(skills, key=lambda s: s["name"]),
        "categories": categories
    }

    with open(OUT_PATH, "w", encoding="utf-8") as handle:
        json.dump(output, handle, indent=2, ensure_ascii=True)
        handle.write("\n")


if __name__ == "__main__":
    build_skills_index()