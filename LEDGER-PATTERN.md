## Session Ledger (resilient to compaction)
Keep exactly one session ledger for this workspace in `LEDGER.md`. Treat it as the source of truth for session context; anything not captured there should not be relied on after compaction. It should be added to .gitignore

### Operating rules
- At the start of every assistant turn, open `LEDGER.md`, refresh it with the current goal/constraints/decisions/state, then continue the task.
- Update `LEDGER.md` whenever any of these change: goal, constraints/assumptions, key decisions, progress state (Done/Now/Next), or important tool outcomes.
- Keep it short and stable: facts only, no transcripts. Prefer bullets. Mark uncertainty as `UNCONFIRMED` (never guess).
- If recall seems missing or a compaction/summary event occurs: rebuild the ledger from visible context, mark gaps as `UNCONFIRMED`, ask 1–3 targeted questions, then proceed.

### `functions.update_plan` vs the ledger
- `functions.update_plan` is short-term execution scaffolding (3–7 steps with pending/in_progress/completed).
- The ledger holds long-lived context across compaction (the “what/why/current state”), not a step-by-step plan.
- Keep them aligned: when the plan or state shifts, update the ledger at the intent/progress level (not every micro-step).

### In replies
- Start with a brief “Ledger Snapshot” (Goal + Now/Next + Open Questions). Print the full ledger only when it materially changes or when the user asks.

### `LEDGER.md` format (keep headings)
- Is ledger git ignored: yes/no
- Goal (incl. success criteria):
- Constraints/Assumptions:
- Key decisions:
- State:
- Done:
- Now:
- Next:
- Open questions (UNCONFIRMED if needed):
- Working set (files/ids/commands):
