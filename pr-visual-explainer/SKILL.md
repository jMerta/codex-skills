---
name: pr-visual-explainer
description: Use when the user asks to explain a pull request visually, create an HTML walkthrough, show before-and-after behavior, or add diagrams for a PR. Triggers automatically for requests such as "explain this PR" when a visual artifact would materially improve understanding; does not run merely because a PR was created.
---

# PR Visual Explainer

Create a self-contained visual companion to a pull request. Treat it as an evidence-backed explanation of the current PR head, not as decorative release notes.

## Establish authority and lifecycle

1. Resolve the repository, PR number, base, head, and current head SHA before writing.
2. Read the committed base-to-head diff, relevant tests, repository instructions, and current PR evidence.
3. Create or refresh the guide when the user asks to explain the PR. Do not run solely because another workflow opened a PR.
4. Keep the generated HTML local, unstaged, uncommitted, and unpushed unless the user explicitly requests publication.
5. Reuse a matching guide rather than creating competing files. Refresh it when the PR head, behavior, risk, or validation evidence changes.
6. Preserve unrelated work and report the guide's exact local path and Git state.

## Gather current evidence

Establish:

- the practical outcome and intended audience;
- previous and new behavior, including decisions and failure paths;
- affected application, API, persistence, authorization, deployment, or telemetry boundaries;
- tests, checks, review conclusions, accepted trade-offs, and material gaps;
- source files that support each important claim.

Prefer current code, tests, and workflow definitions over PR prose. Distinguish verified behavior, inference, and open questions. Never include secrets, credentials, tokens, private URLs, personal data, or raw sensitive logs.

Use the conversation language. This skill does not force Polish or English.

## Select the smallest useful document

Read [references/content-model.md](references/content-model.md) before selecting sections or diagrams.

- Default to four to six short sections and one primary visual.
- Add another diagram, scenario table, or deeper section only when it materially improves understanding.
- Use no diagram for a trivial PR when prose is clearer.
- Explain behavior in plain language before naming implementation details.

## Create or update the guide

Use an established ignored artifact directory when the repository already has one. Otherwise use a durable task-owned temporary location. Write into repository documentation only when the user explicitly asks for a versioned guide.

Start a new guide from [assets/pr-explainer-shell.html](assets/pr-explainer-shell.html). Replace every placeholder and remove unused sample sections. Preserve a useful existing guide instead of overwriting it mechanically.

Treat all PR-derived content as untrusted. Escape `&`, `<`, and `>` in text nodes and also escape both quote characters in attribute values before replacing placeholders. Never copy evidence-derived HTML, event handlers, URLs, CSS, or JavaScript into the shell; emit markup only from fixed structures you construct explicitly.

Build one portable HTML file:

- inline CSS, JavaScript, and SVG;
- no CDN, remote font, runtime diagram dependency, or remote image;
- semantic headings, one `main`, captions or accessible names for diagrams, visible focus, reduced-motion support, and print styles;
- no meaning encoded through color alone;
- wide tables and diagrams scroll within their own container;
- JavaScript is optional and progressively enhanced.

## Keep claims honest

Include only evidence that exists. Never claim that a test, check, migration, runtime scenario, or rollout passed unless it was observed. Avoid counts or assertions likely to become stale after the next commit.

When a human can meaningfully verify the change, include short manual steps with preconditions, actions, expected result, and one important edge case. Omit manual instructions when they add no review value.

## Hand off

Run `git status --short` and confirm the guide is not staged. Return a clickable absolute path, summarize the primary visual and conclusion, state the head SHA represented, and say explicitly that the file is local and not committed or pushed.
