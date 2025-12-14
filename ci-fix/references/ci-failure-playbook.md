# CI failure playbook (GitHub Actions)

Use this to quickly map symptoms to likely causes, next commands, and safe fixes.

## Fast path
1) Get the failing step output: `gh run view <id> --log-failed`
2) Identify if it’s:
   - config/workflow syntax
   - permissions/secrets
   - environment mismatch (tool/runtime)
   - flaky test / external dependency
   - action/tooling regression
3) Apply the smallest safe fix, then rerun failures: `gh run rerun <id> --failed`

## Common failures (symptom -> fix direction)

### Workflow doesn’t start / missing required check
- **Symptoms:** no run created; branch protection says a check is missing; expected workflow name differs.
- **Check:** workflow name/job names match required checks; triggers include the target event/branch.
- **Fixes:**
  - Align `name:` (workflow) and job names with branch protection expectations.
  - Fix `on:` filters (`push.branches`, `pull_request.branches`, `paths`, `paths-ignore`).
  - If a workflow was renamed, update branch protection rules accordingly.

### YAML / workflow syntax errors
- **Symptoms:** "Invalid workflow file", "Unexpected value", "Unrecognized named-value".
- **Fixes:**
  - Validate indentation and list/map structure (YAML is whitespace-sensitive).
  - Quote strings that contain `:` or `{`/`}` when they are meant to be literal.
  - Ensure expressions are in `${{ ... }}` and not mixed with shell interpolation.

### “Resource not accessible by integration” / permission errors
- **Symptoms:** checkout, commenting, releases, packages, or API calls fail with 403/404.
- **Check:** whether the run is `pull_request` from a fork (secrets/token are restricted).
- **Fixes:**
  - Add least-privilege `permissions:` at workflow/job level (e.g., `contents: read`).
  - For deployments using OIDC, ensure `id-token: write` is set where needed.
  - Avoid “fixes” that expose secrets to fork PR code; prefer splitting privileged jobs to `push` on trusted branches.

### Secrets not available (especially fork PRs)
- **Symptoms:** missing env vars, auth failures, “secret not set”, deploy steps skipped.
- **Fix direction:**
  - For fork PRs, redesign the workflow so untrusted code doesn’t need secrets (build/test only).
  - Gate privileged steps behind trusted events/branches.
- **High risk:** switching to `pull_request_target` can leak secrets if you check out / run PR code.

### Checkout / git history / submodules issues
- **Symptoms:** missing tags/commits, versioning tools fail, submodule fetch fails.
- **Fixes:**
  - Use `actions/checkout` with `fetch-depth: 0` when full history is required.
  - Enable submodules explicitly (`submodules: recursive`) when needed.
  - Ensure credentials are available for private submodules (often needs a PAT; call out risk).

### Cache problems
- **Symptoms:** stale deps, intermittent build failures, cache restore misses.
- **Fixes:**
  - Include lockfiles in cache keys and bump keys when the cache format changes.
  - Prefer the package manager’s official cache strategy; avoid caching `node_modules` unless required.
  - If in doubt, test once with caches disabled to confirm.

### Runtime/tooling mismatch
- **Symptoms:** works locally but fails in CI; “unsupported engine”; Java/Node/Python version mismatch.
- **Fixes:**
  - Pin tool versions explicitly (setup actions) and match local dev versions.
  - Ensure workflow uses the correct working directory and config files.
  - For monorepos, confirm each job sets `working-directory` appropriately.

### Flaky tests / external services
- **Symptoms:** timeouts, sporadic failures, rate limits.
- **Fix direction:**
  - Stabilize tests (seed randomness, isolate shared state, increase timeouts with justification).
  - Add retries only for clearly flaky, idempotent operations (and track follow-up).
  - Consider quarantining truly flaky tests with a clear ticket and owner.

