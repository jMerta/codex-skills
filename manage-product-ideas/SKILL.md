---
name: manage-product-ideas
description: Use when the user asks to capture, clarify, document, audit, generate, compare, prioritize, validate, or realize product ideas. Guides one-question-at-a-time discovery, evidence-based scoring, explicit readiness decisions, and scoped delivery without assuming a specific product, repository layout, or planning plugin.
---

# Manage Product Ideas

Turn a fuzzy opportunity into a documented, evidence-backed decision. Treat current code, tests, contracts, analytics, and operations as truth about the product; treat idea documents and Git history as decision context.

Read [references/idea-workflow.md](references/idea-workflow.md) for `DOCUMENT`, `AUDIT`, `GENERATE`, `SELECT`, or `REALIZE`. Also read it for `GRILL` when the request includes documentation updates.

## Route the request

Choose the narrowest applicable mode:

| Request | Mode |
| --- | --- |
| Raw or fuzzy idea | `GRILL` |
| Create or revise an idea document | `DOCUMENT` |
| Review an idea portfolio | `AUDIT` |
| Propose new directions | `GENERATE` |
| Choose what to do next | `SELECT` |
| Build an approved idea | `REALIZE` |

For combined requests, use only applicable modes in this order: `AUDIT → GENERATE → GRILL → DOCUMENT → SELECT → REALIZE`.

## Grill before judging

1. Inspect available repository, product, customer, and operational evidence.
2. Ask exactly one unresolved product decision.
3. Include a recommended answer and its primary trade-off.
4. Wait for the user's answer.
5. Update the idea document immediately when documentation changes were requested.
6. Continue until critical decisions are resolved and both sides share the same understanding.

Do not ask the user for facts that available sources can answer. Do not dump a questionnaire. Do not score, select, plan, or implement while critical branches remain unresolved.

Discover the repository's existing product-idea convention before creating files. If none exists and documentation is requested, default to `docs/product-ideas/<slug>.md`. Do not create a parallel hierarchy without a reason.

## Preserve decision quality

- Separate facts, assumptions, recommendations, confidence, and next actions.
- Recover why a removed capability disappeared before proposing its return.
- Prefer a bounded first useful outcome over platform work without a concrete customer case.
- Below 70% confidence, choose a validation step instead of implementation.
- Generate at most three candidates by default and persist only the candidates the user chooses.
- Do not treat a numerical score as stronger than its evidence.

## Gate realization

Before implementation, require:

- a defined user and problem;
- meaningful evidence or an explicit validation hypothesis;
- a measurable outcome and stop condition;
- a bounded first release and non-goals;
- identified dependencies, trust boundaries, risks, rollout, and rollback;
- resolved critical product rules.

Implementation, commits, pushes, and pull requests require their normal authorization. A selected idea or plan does not by itself authorize code changes.

## Hand off

Return the current decision, confidence, strongest evidence, largest unknown, next action, and any document changed. When comparing candidates, explain why the runner-up loses instead of presenting scores without a decision.
