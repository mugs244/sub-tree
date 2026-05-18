# AI Workflow Rules

## Approach

Build Sub-tree incrementally using a spec-driven workflow. The five context files (`CLAUDE.md`, `ARCHITECTURE.md`, `UI_CONTEXT.md`, `STANDARDS.md`, `PROGRESS.md`) define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behavior from scratch. When a spec is unclear, fix the spec first, then implement.

Read order at the start of every session: `CLAUDE.md` → `ARCHITECTURE.md` → `UI_CONTEXT.md` → `STANDARDS.md` → `PROGRESS.md`. The first three describe the target; the fourth describes the rules; the fifth describes where you are. Without all five in context, do not write code.

Before starting work on a unit, restate in one sentence what you're about to do and which invariants from `ARCHITECTURE.md` apply. This forced summary catches drift before code is written.

## Scoping Rules

- Work on one feature unit at a time. A "unit" is a vertical slice small enough to verify end-to-end in a single session — e.g., "signup page POSTs to API and creates a user record" is one unit; "the entire auth system" is not.
- Prefer small, verifiable increments over large speculative changes. Three commits of 80 lines each is better than one commit of 240. Each increment must leave the project in a working, runnable state.
- Do not combine unrelated system boundaries in a single implementation step. Database schema changes and UI changes and webhook handlers do not share a commit.
- Match implementation order to dependency order. Schema before service before route before page. Don't build a page that calls an endpoint that doesn't exist.
- Stop when the unit is done. Don't start the next one in the same session unless the first one is fully verified, committed, and reflected in `PROGRESS.md`. Scope creep within a session is how invariants get violated.
- Estimate before starting. If a unit looks like it'll take more than ~30 minutes of focused work, split it. If it can be split, split it. If it can't, write down why and proceed cautiously.

## When to Split Work

Split an implementation step if it combines:

- UI changes and background task changes (e.g., the signup form and the SMS-sending worker — different files, different concerns, different failure modes).
- Multiple unrelated API routes (`/api/auth/signup` and `/api/links/create` are separate units, even if you're tempted to "just knock both out").
- Schema changes and the code that uses the new schema (run the migration first, verify it's clean, then add the consuming code).
- Behavior not clearly defined in the context files (stop, define it, then implement).
- A new external integration and the feature that depends on it (wire up Africa's Talking with a hardcoded test message first; then build the OTP flow that calls it).
- Authentication logic and authorization logic (verifying a session is one thing; verifying ownership is another).
- New code and refactoring of existing code (refactor first as its own commit, then add the new feature).
- More than one route handler in the same step.
- Frontend and backend changes that aren't dependent on each other within the same commit.

If a change cannot be verified end to end within ~30 minutes by running `npm run dev` and clicking through the flow, the scope is too broad — split it.

If you find yourself writing more than one TODO comment in a single unit, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files. Don't add fields to the schema that aren't in `CLAUDE.md` or `ARCHITECTURE.md`. Don't add UI elements that don't have a design decision documented. Don't add API endpoints whose contract isn't specified.
- If a requirement is ambiguous, resolve it in the relevant context file before implementing. The fix goes into `CLAUDE.md` (product), `ARCHITECTURE.md` (system), `UI_CONTEXT.md` (visual), or `STANDARDS.md` (code) — whichever owns the concern. Commit the doc change in the same commit or just before the code change.
- If a requirement is missing entirely, add it as an open question in `PROGRESS.md` under "Open Questions" before continuing. Do not block on it if other work is available; do block on it if the missing answer would force a rewrite.
- If you encounter a contradiction between two context files, surface it explicitly. Don't pick one and proceed. The contradiction is the user's decision to make.
- When in doubt about scope, ask. One clarifying question costs five minutes; an incorrect implementation costs an hour to undo plus the dignity hit.

## Protected Files

Do not modify the following unless explicitly instructed:

- `components/ui/*` — generated shadcn/ui primitives. If you need to customize a primitive, wrap it in a new component in `components/` instead. shadcn updates would otherwise conflict with hand edits.
- `db/migrations/*` — once a migration has been applied, it is immutable history. Create a new migration to change schema; never edit an old one.
- `package-lock.json` — managed by npm. Don't hand-edit.
- `node_modules/` — never, ever.
- `.env`, `.env.local`, `.env.production` — secrets, hand-managed. `.env.example` is the only env file in source control.
- `prisma/generated/*` (if used) — generated client code. Regenerate, don't edit.
- `public/*` — static assets. Only add new files; don't modify existing ones unless replacing them deliberately.
- Any file with a `// AUTOGENERATED` or `// DO NOT EDIT` header comment.
- Anything in `docs/` that the user has not asked to be changed — these are the specs, not the code. Suggest changes; do not make them silently.

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes the following:

- **System architecture or boundaries** → `ARCHITECTURE.md`. New service, new external dependency, new storage layer, changed auth flow, changed invariant.
- **Storage model decisions** → `ARCHITECTURE.md` and the Prisma schema. New table, new index, new constraint, changed relationship.
- **Code conventions or standards** → `STANDARDS.md`. New pattern adopted, old pattern deprecated, lint rule changed.
- **Feature scope** → `CLAUDE.md`. New feature added to scope, feature moved out of scope, success criterion changed.
- **Visual or design decisions** → `UI_CONTEXT.md`. New token, changed token value, new layout pattern, new component standard.
- **Progress** → `PROGRESS.md`. Always, on every meaningful commit. Move items from "Next Up" → "In Progress" → "Completed." Add session notes for context the next session needs.

A commit that changes architecture or scope without updating the relevant doc is incomplete. The docs and the code ship together.

When updating a doc, include a one-line entry in the commit message explaining what changed and why. Example: `docs(architecture): add Cloudflare R2 to stack for avatar storage`.

## Communication Inside a Session

- When asked to do something, do it. Don't pad responses with unnecessary preamble or explanation of what you're about to do unless the user asked.
- When a decision needs to be made and the spec doesn't cover it, surface the decision explicitly with the trade-offs. Don't bury it inside a generated paragraph and hope it gets noticed.
- When an error blocks progress, stop and report the exact error and the exact attempted fix. Don't loop on retries. Three attempts at the same fix is the limit before reporting up.
- When you finish a unit, state what was done, what was committed, and what `PROGRESS.md` was updated to reflect. Don't ask "do you want me to continue?" unless the next unit needs a decision — just stop cleanly and wait.
- Disagreement is allowed and useful. If a request would violate a documented invariant, say so before complying or refusing. The user may have a reason; the user may also have forgotten the invariant.

## Before Moving to the Next Unit

A unit is not done until every item below is true. Do not start a new unit if any of these are still open.

1. **The current unit works end to end within its defined scope.** Not "it compiles." Not "the tests pass." It actually does the thing it was supposed to do, verified by running the dev server and exercising the flow.
2. **No invariant defined in `ARCHITECTURE.md` was violated.** Cross-check the 12 invariants explicitly. If any was bent — even temporarily — it goes in `PROGRESS.md` as technical debt with a target resolution.
3. **`PROGRESS.md` reflects the completed work.** Move the item from "In Progress" to "Completed." Update "Next Up." Add session notes for anything the next session needs to know.
4. **`npm run build` passes.** No type errors, no lint errors, no build warnings that weren't already there. If a warning is genuinely unfixable, document it in `STANDARDS.md` under known exceptions.
5. **`npm run lint` passes.** ESLint and Prettier both clean. No `eslint-disable` comments added in this commit unless justified inline with a comment.
6. **All TypeScript is strict-mode clean.** No new `any`, no new `// @ts-expect-error`, no new `// @ts-ignore`. If one was necessary, document why in the code and in `PROGRESS.md`.
7. **No new console.log or debug statements committed.** `console.error` in error handlers is acceptable; `console.log("hi")` is not.
8. **No new secrets in committed code.** API keys, tokens, passwords — environment variables only.
9. **PII handling matches `ARCHITECTURE.md` invariant 6.** Phone numbers masked in logs, no full numbers persisted unnecessarily, no PII in error responses returned to the client.
10. **The commit message describes the change clearly.** `fix: stuff` is rejected. `feat(signup): add live username availability check via /api/auth/check-username` is acceptable. Conventional Commits format preferred.
11. **The change is committed.** Uncommitted work is not work. If the unit is done, the commit exists. If the commit doesn't exist, the unit isn't done.
12. **The next "Next Up" item in `PROGRESS.md` is actionable.** If it now depends on a decision that wasn't required before, that decision is logged as an open question and the next item is reordered.

If any item fails, fix it before moving on or split it out as an explicit follow-up task in `PROGRESS.md`. Do not silently leave broken state behind.

## Hard Stops

Stop immediately and surface the issue if any of the following happens:

- A request would violate a documented invariant.
- A request would touch a protected file.
- An error happens that you don't understand and three attempts at fixing it didn't help.
- The work in progress has grown past the scope of a single unit.
- A piece of the spec is contradictory or missing in a way that blocks correct implementation.
- A third-party API integration is returning behavior that doesn't match its documentation.
- A migration would be destructive (drop a column, drop a table, change a type that risks data loss). Halt and confirm before running.
- An external secret or credential has been accidentally committed. Halt, rotate the secret, and remove from git history before continuing.

A hard stop is a feature, not a failure. Catching these early is the whole point of the workflow.