---
name: codex-skin-pack-installer
description: Install public-safe Codex desktop skin packs from ChannelerH/codex-skin-packs, stage verified theme.json/background.png files, and keep restore guidance visible.
---

# Codex Skin Pack Installer

Use this skill when a user wants to find, download, validate, apply, switch, or
restore Codex desktop theme and skin packs.

This skill stages public-safe skin packs from
`ChannelerH/codex-skin-packs`. It does not patch `app.asar`, modify signed app
bundles, upload private Codex screenshots, or claim OpenAI affiliation.

Public gallery and install guide:
https://codex-theme-gallery.howardhua.chatgpt.site/codex-skin-pack-installer?utm_source=jmerta-codex-skills&utm_medium=skill-catalog&utm_campaign=skill-installer

## Quick Start

List available packs:

```bash
python3 "$CODEX_SKILL_DIR/scripts/fetch_skin_pack.py" --list
```

Stage the readable starter pack:

```bash
python3 "$CODEX_SKILL_DIR/scripts/fetch_skin_pack.py" caishen-readable
```

The helper downloads from the public GitHub release, enforces download and zip
size limits, checks zip path safety, requires `theme.json` and
`background.png`, validates JSON, and atomically stages the replacement under
`~/.codexthemes/packs/<slug>` unless `--out` is provided.

## Workflow

1. Identify the requested pack slug. If the user gives a vague style, list
   packs and choose the closest match.
2. Run `scripts/fetch_skin_pack.py <slug>` to stage the pack.
3. Inspect the staged folder before applying it.
4. Apply the staged pack with the user's active Codex theme manager or Codex
   Dream Skin workflow.
5. Verify Home, Task, Diff, and Composer readability if a live check is
   possible. If not, provide the staged path and manual apply guidance.
6. Always finish with a restore path for the user's active theme manager.

## Pack Slugs

- `caishen-readable` - low-strain light fortune skin.
- `caishen-lite` - soft fortune skin with readable working areas.
- `caishen-max` - brighter fortune skin for short immersive sessions.
- `global-founder-bright` - bright international growth workspace skin.
- `export-night` - dark export-ops skin.
- `mythic-guardian-noir` - dark mythic focus skin.

## Safety Rules

- Do not upload or publish real Codex workspace screenshots.
- Do not include task names, chats, sidebars, file paths, emails, keys, or
  project names in public assets.
- Do not claim the skin pack is official OpenAI software.
- Do not patch `app.asar` or the signed Codex application bundle.
- Keep `theme.json` and `background.png` together.

## Useful Prompts

Apply a staged pack:

```text
Apply the Codex skin pack staged at STAGED_PATH.
Use my active Codex theme manager or Codex Dream Skin workflow.
Keep the native Codex layout interactive.
Do not upload private workspace screenshots.
Verify Home, Task, Diff, and Composer readability if possible.
Tell me the restore path before finishing.
```

Restore default appearance:

```text
Restore my Codex desktop theme to the default appearance.
Use my active Codex theme manager's restore path.
Verify the sidebar, home screen, task view, diff view, and composer are back to readable native styling.
Do not modify app.asar or the signed application bundle.
```
