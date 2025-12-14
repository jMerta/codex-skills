---
name: plan-work
description: "Plan changes end-to-end: do repo research, analyze options/risks, and produce a concrete development + verification plan. Use when the user asks for a plan, design/approach, scope breakdown, rollout strategy, or implementation steps."
---

# Plan work

## Goal
Produce an actionable plan that is:
- grounded in what the repo already does (research)
- explicit about decisions and risks (analysis)
- concrete about steps, files, and verification (development)

## Inputs to ask for (if missing)
- Outcome/acceptance criteria (what "done" means).
- Constraints: time, backwards compatibility, performance, security, data migration.
- Target environment(s): local/stage/prod; any feature flags or rollout requirements.
- Non-goals (what not to do).

## Workflow (research -> analysis -> development)
1) Research (current state)
   - Read repo guidance first: `AGENTS.md`, `README.md`, `docs/` (only if needed).
   - Identify entrypoints and owners (backend/frontend/infra).
   - Find relevant code paths and patterns:
     - `rg` for symbols, endpoints, config keys, error strings
     - `git log -p` / `git blame` for history and intent when uncertain
   - Capture findings as short bullets with file paths.
2) Analysis (what to change and why)
   - Restate requirements and assumptions.
   - List options (1-3) with tradeoffs; pick one and justify.
   - Identify risks/edge cases and how you will validate them.
   - Call out open questions that block implementation.
3) Development plan (how to do it)
   - Break into small steps in a sensible order (migrations/config first, then code, then docs).
   - Name likely files/dirs to change.
   - Include verification commands (unit/integration/build) and a rollback/mitigation plan when relevant.
   - If the change spans modules, include coordination steps (contract changes, client regen, versioning).

## Deliverable
Use `references/plan-template.md` and fill it in.

