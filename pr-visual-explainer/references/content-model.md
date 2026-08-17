# PR explainer content model

Select only sections and visual forms that improve understanding of the current pull request.

## Core principles

1. Lead with the practical outcome.
2. Explain previous behavior before implementation details.
3. Separate verified behavior, inference, accepted risk, and missing evidence.
4. Tie important claims to current repository evidence.
5. Prefer one informative visual over several decorative diagrams.
6. Keep one main idea per section.

## Default structure

### Outcome

Name the pull request, practical result, audience, and current head SHA. State why the change exists in two or three sentences.

### Before and after

Describe the concrete behavioral difference. Use two-column cards only when both sides have the same grain; otherwise use short prose.

### Main flow

Show the primary journey, decision, or control flow. Include only branches, fallbacks, and boundaries that affect the result.

### Risks and boundaries

Separate risk removed, accepted trade-off, behavior outside scope, and remaining verification gap.

### Verification and sources

List checks that actually ran and map important claims to code, tests, migrations, manifests, or workflow definitions.

### Optional manual test

Add three to six actions only when the change has a meaningful human-visible or operator-visible path.

## Visual selection

| Relationship | Preferred visual |
| --- | --- |
| Old and new behavior at the same grain | Before/after comparison |
| A choice with branches or fallbacks | Decision flow |
| Calls across actors or services | Sequence diagram |
| Lifecycle or status changes | State diagram |
| One journey across several owners | Swimlanes |
| Exact scenario, endpoint, or coverage mapping | Table |
| Component dependencies | Small architecture map |

Use CSS layout for compact comparisons and flows. Use inline SVG when connector routing, lanes, timing, or state transitions require exact placement. Add a caption and accessible name. Do not diagram every file.

## Writing

- Match the user's language.
- Put consequences before mechanism.
- Define technical terms when they first matter.
- Keep diagram labels shorter than prose.
- Use exact code identifiers only where they help.
- Avoid unsupported claims such as "fully safe" or "complete coverage."
