# AGENTS.md template (copy/paste)

## Root AGENTS.md (monorepo)

Use this at repo root when you have multiple subprojects/modules.

```markdown
# Agent instructions (scope: this directory and subdirectories)

## Scope and layout
- **This AGENTS.md applies to:** `<path/>` and below.
- **Key directories:**
  - ...

## Modules / subprojects
Use `references/module-map-format.md` for the table format.

## Cross-domain workflows
- **Frontend -> backend API**
  - API base URL / env vars: ...
  - Auth/session expectations (cookies, headers): ...
  - Contract location (OpenAPI/GraphQL) and how to update clients: ...
- **Local dev (run together)**
  - Start backend: ...
  - Start frontend: ...
  - Common gotchas (CORS, ports, proxies): ...

## Verification (preferred commands)
- Run the smallest meaningful checks first.
- Prefer quiet/silent modes on the first run to avoid flooding context; only re-run narrowed failures with verbose logs when debugging.

### Backend (example: Gradle / Java)
- **Where:** run from `<backend-path>/`
- **Prereqs:** Java `<version>`, local DB (often via `docker compose up`)
- **Build:** `./gradlew clean build`
- **Unit tests:** `./gradlew test`
- **Integration tests:** `./gradlew integrationTest` (or your repo's task)
- **Single test/class:** `./gradlew test --tests <package.ClassName>`
- **Quiet first pass:** `./gradlew test --console=plain --quiet`
- **Debug a failure:** `./gradlew test --tests <package.ClassName> --info --console=plain`
- **Checks/lint:** `./gradlew check`
- **Formatting (after tests are green):** `./gradlew spotlessApply` (or your formatter task)

### Frontend (example: bun / node)
- **Where:** run from `<frontend-path>/` (repeat for other frontends like `<frontend-client-path>/`, `<landing-path>/` if applicable)
- **Dev:** `bun run dev` (or `npm run dev`)
- **Build smoke:** `bun run build && bun run start`
- **Lint/type-check:** `bun run lint` and `bun run type-check`
- **Tests:** `bun run test`
- **Quiet first pass:** `bun run test -- --silent` (or `npm test -- --silent`)
- **Target one file/case:** `bun run test -- <pattern>` or `bun run test -- -t "<name>"`

## Docs usage
- Do not open/read `docs/` by default.
- Consult docs only when the user asks or the task requires it (docs updates, onboarding, ops/runbooks, verifying intended behavior).

## Global conventions
- ...

## Do not
- Put tech-specific commands here (keep them in module AGENTS.md).
- ...

## Links to module instructions
- `<module-path>/AGENTS.md`
- ...
```

## Module AGENTS.md (component-specific)

Use this inside each module/component root (backend/frontend/docs/etc.). This is where tech-specific instructions belong.

```markdown
# Agent instructions (scope: this directory and subdirectories)

## Scope and layout
- **This AGENTS.md applies to:** `<path/>` and below.
- **Owner:** `<team>`
- **Key directories:**
  - ...

## Commands (use what this repo uses)
- **Install:** ...
- **Dev:** ...
- **Test:** ...
- **Build:** ...

## Feature map (optional)
Use `references/feature-map-format.md` for the table format.

## Conventions
- ...

## Common pitfalls
- ...

## Do not
- ...
```
