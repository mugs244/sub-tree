# Code Standards

## General

- Keep modules small and single-purpose. If a file exceeds ~300 lines or describes more than one thing, split it. A `LinksList.tsx` does not also handle drag-and-drop logic, API mutations, and modal state.
- Fix root causes, do not layer workarounds. If a bug keeps recurring in different forms, the fix isn't another conditional — it's understanding why the bug exists. Document the root cause in the commit message.
- Do not mix unrelated concerns in one component or route. A signup page renders the signup UI; it does not also fetch dashboard data or define analytics tracking. Concerns belong in their own files.
- Write code that's obvious over code that's clever. The next developer (or the next Claude Code session) needs to read it in 30 seconds without asking why.
- No dead code, no commented-out blocks left "just in case." Git history is the safety net. If you remove something, remove it cleanly.
- Errors are not strings. Throw typed errors with enough context that the caller knows what failed and what to do. `throw new Error("failed")` is forbidden — `throw new SignupError("USERNAME_TAKEN", { username })` is acceptable.
- Comments explain *why*, not *what*. The code already shows what. If a comment is needed to explain what, the code is unclear and should be rewritten.
- No premature abstraction. Build the concrete thing first. Extract a helper or hook only when the second usage appears, never on the first.
- Logging is structured, not free-form. Use a logger (e.g. `pino`) with consistent fields (`level`, `event`, `user_id`, `request_id`). `console.log` is for local debugging only and must be removed before commit.
- Every feature change touches `PROGRESS.md` in the same commit. The repo and the progress log stay in lockstep.

## TypeScript

- Strict mode is required throughout the project. `"strict": true` plus `"noUncheckedIndexedAccess": true` and `"noImplicitOverride": true` in `tsconfig.json`. No exceptions.
- Avoid `any`. Use explicit interfaces, narrowly scoped types, or `unknown` if the shape is genuinely unknown at compile time. `as any` to silence the compiler is forbidden — fix the type, don't bypass it.
- Validate unknown external input at system boundaries before trusting it. Every API route, every webhook handler, every form submission goes through Zod (or equivalent) before any logic runs. After parsing, the type is known and trusted.
- Discriminated unions over enums for state machines. Username status, donation status, OTP state — model these as `{ state: "available" } | { state: "error", reason: string }` so the compiler enforces exhaustiveness.
- Prefer `type` for unions and aliases, `interface` for object shapes that might be extended. Be consistent within a file.
- No type assertions (`as Foo`) except at parse boundaries where the runtime check has already happened. If you need an assertion in business logic, the upstream type is wrong.
- Function signatures are explicit. Return types declared on all exported functions. Inferred returns are fine inside a single file, but exported APIs are contracts and must say so out loud.
- `null` for "intentionally absent" (e.g. `email_verified_at: Date | null` in DB rows). `undefined` for "not yet set" or "optional". Never mix them on the same property — pick one and stay consistent.

## Next.js (App Router)

- Default to server components. Mark a component `"use client"` only when it needs browser-only APIs (state, effects, event handlers, refs). The signup page is a client component because it has form state. The public profile page is a server component because it just renders data.
- Keep `"use client"` boundaries small. Put the interactive island inside a client component and let the rest of the page stay on the server. Big client components on a public page hurt 3G performance.
- Route handlers (`route.ts` files) do one thing. `POST /api/auth/signup` handles signup. It does not also handle login, OTP verification, or password reset — those are separate routes.
- Use Server Actions for mutations triggered from server components when sensible (e.g. dashboard form submissions); use route handlers when the call needs to be made from a client component or from outside the app (webhooks, mobile clients later).
- File-based routing reflects the URL. `app/[username]/page.tsx` is the public profile, `app/[username]/donate/page.tsx` is the donation page, `app/(dashboard)/links/page.tsx` is the dashboard's Links tab. Use route groups `(...)` to organize without affecting URLs.
- Loading and error states are first-class. Every route segment has a `loading.tsx` (skeleton, not spinner) and an `error.tsx` (typed error message, retry button). Never leave a user staring at a blank screen.
- Metadata (`<title>`, OG tags) is defined per-route via the `metadata` export. The public profile page's OG image must be dynamically generated to show creator avatar + name (use `@vercel/og` or equivalent).
- Don't fetch the same data twice. Use `cache()` from React or `unstable_cache` from Next where appropriate. Co-locate data fetching with the component that uses it; don't pass massive prop drills.
- Environment variables: `NEXT_PUBLIC_*` for client-exposed values, plain names for server-only (database URLs, API secrets, etc.). Never reference a server-only env var from a client component — the build will silently inline `undefined`.

## Styling

- Use CSS custom property tokens defined in `app/globals.css` and `UI_CONTEXT.md`. No hardcoded hex values in component files. `text-[#111827]` is forbidden; `text-[color:var(--text-primary)]` (or the mapped Tailwind class `text-primary`) is correct.
- Follow the border radius scale defined in `UI_CONTEXT.md`. Don't introduce new radii ad hoc. `rounded-md` doesn't exist in our scale — use `rounded-lg`.
- Tailwind utility classes over CSS modules or styled-components. The exception is the small `app/globals.css` for tokens and rare cross-cutting concerns (focus-visible defaults, scroll behavior).
- No inline `style` props except for genuinely dynamic values (e.g. a user's chosen theme color, an image background URL). Static styling lives in classes.
- Mobile-first responsive: base styles target mobile, `md:` and `lg:` add desktop adjustments. Never the reverse.
- `dark:` classes are forbidden at MVP. Dark mode is a Pro-tier feature added later; don't add the work now.
- Component classes ordered consistently: layout → box model → typography → colors → effects → state variants. Use Prettier's Tailwind plugin to enforce this automatically.
- Don't fight Tailwind with custom CSS. If a utility doesn't exist for what you need, check `tailwind.config.ts` first — most needs are one config extension away.

## API Routes

- Validate and parse request input with Zod before any logic runs. If parsing fails, return `400` with a structured error: `{ error: "VALIDATION_ERROR", fields: { phone: "Invalid format" } }`. Never let unvalidated input touch business logic.
- Enforce auth and ownership before any mutation. A creator can only edit their own links, view their own donations, change their own settings. Check `session.user_id === resource.user_id` explicitly — don't trust that the URL params imply ownership.
- Return consistent, predictable response shapes. Success: `{ data: ... }`. Error: `{ error: "ERROR_CODE", message: "Human-readable explanation" }`. HTTP status codes match: `200/201` for success, `400` for validation, `401` for unauth, `403` for forbidden, `404` for not found, `429` for rate limited, `500` for server error.
- Rate limit every mutation endpoint. Signup: 5/hour per IP, 3/day per phone. OTP verify: 5 attempts per phone per 15min. Donations: 10/minute per donor phone. Use Redis-backed counters with sliding window.
- Idempotency on payment-related routes. Donation creation accepts an `Idempotency-Key` header; replays with the same key return the original response, not a new charge. This is non-negotiable for MoMo flows.
- Webhooks verify their signature before processing. MTN MoMo, Airtel Money, and Africa's Talking all sign their webhooks — verify the signature, then process. Never trust an unsigned webhook.
- Webhook handlers are async-safe and idempotent. The same webhook may fire multiple times. Use the provider's transaction ID as a dedupe key, store processed IDs, and short-circuit duplicates.
- No business logic in route handler files. The route handler validates input, calls a service function (`lib/services/auth.ts`, `lib/services/donations.ts`), and shapes the response. The service does the work.
- Log every request with `request_id`, `user_id` (if any), route, status, latency. This is the difference between "production is broken" and "production is broken and we know why."
- Never log secrets, passwords, OTPs, PINs, full phone numbers, or MoMo transaction tokens. Mask in logs: `256-7XX-XXX-123` not `256-7XX-XXX-1234`.

## Data and Storage

- Metadata belongs in the database (Postgres). User records, profile fields, links, donation transactions, page view aggregates — all in Postgres. Use Prisma migrations, never modify schema by hand on the live DB.
- Large or generated content belongs in file/blob storage (Cloudflare R2, S3, or similar). User avatars, custom backgrounds, exported CSVs of transactions. The database stores the URL, not the binary.
- Do not store large content directly in the database. No base64 images in user rows, no JSON blobs over a few KB. Move it out before it becomes a problem.
- Ephemeral state belongs in Redis (OTPs, rate-limit counters, session cache, idempotency keys). Use TTL — never store something in Redis without a TTL.
- Financial data is append-only. Donations, payouts, fees — never updated, never deleted. Status changes happen via new rows referencing the original (e.g. `donation_events` table linked to `donations`). The original record is the source of truth.
- Timestamps everywhere. Every table has `created_at`, mutable tables have `updated_at`. Use `timestamptz` in Postgres, not naive `timestamp`. All timestamps stored UTC, displayed in user's local time on the frontend.
- Soft delete where data loss would be expensive (user accounts, financial records). Hard delete where it would be safer (OTPs, session tokens, expired idempotency keys).
- Foreign keys enforced at the DB level, not just at the ORM level. `ON DELETE CASCADE` for owned data (a user's links die with the user), `ON DELETE RESTRICT` for referenced data (can't delete a user who has donations — must anonymize instead).
- Indexes are not optional. Index every foreign key, every column used in WHERE clauses, every column used in ORDER BY. Use Prisma's `@@index` and verify with `EXPLAIN ANALYZE` on real query patterns before launch.
- PII handling: phone numbers, emails, payout MoMo numbers are PII. Encrypt at rest (Postgres column encryption or app-level for high-sensitivity fields). Never log full PII. Plan for a "delete my data" endpoint to comply with future regulations.

## File Organization

- `app/` — Next.js App Router pages, layouts, and route handlers. Mirror the URL structure exactly.
- `app/(auth)/` — Route group for auth pages (signup, login, verify, password reset). Doesn't affect URLs, just keeps related routes together.
- `app/(dashboard)/` — Route group for authenticated creator dashboard pages.
- `app/api/` — API route handlers. Subfoldered by domain: `app/api/auth/`, `app/api/links/`, `app/api/donations/`, `app/api/webhooks/`.
- `app/[username]/` — Dynamic public profile pages and the donation flow.
- `components/ui/` — shadcn/ui primitives. Generated by the shadcn CLI. Don't edit these directly.
- `components/` — Domain components specific to Sub-tree: `LinkCard.tsx`, `DonationSheet.tsx`, `UsernameInput.tsx`, `ProfilePreview.tsx`, etc.
- `components/brand/` — Logo, wordmark, and other brand assets as components.
- `lib/` — Shared utilities and helpers. Pure functions, no React.
- `lib/services/` — Business logic. `auth.ts`, `donations.ts`, `links.ts`, `momo.ts`. Called by route handlers, not the other way around.
- `lib/validators/` — Zod schemas for input validation. One file per domain: `auth.ts`, `donations.ts`, etc.
- `lib/db.ts` — Prisma client singleton. Import from here, never `new PrismaClient()` inline.
- `lib/redis.ts` — Redis client singleton.
- `lib/sms.ts` — SMS provider abstraction (Africa's Talking implementation, future-proof for Twilio fallback).
- `lib/momo/` — Mobile money provider integrations. `mtn.ts`, `airtel.ts`, `index.ts` (provider router).
- `lib/auth/` — Session, password hashing, OTP generation/verification.
- `lib/logger.ts` — Structured logger setup.
- `db/` — Prisma schema, migrations, seed scripts.
- `db/schema.prisma` — The schema. Single source of truth for the data model.
- `db/seed.ts` — Seed data for reserved usernames, dev fixtures.
- `db/migrations/` — Auto-generated by Prisma migrate. Never edit by hand after they're applied.
- `types/` — Shared TypeScript types not tied to a specific domain (`Session`, `ApiResponse`, etc.). Domain-specific types live with their domain.
- `public/` — Static assets. Favicons, OG fallback images, robots.txt.
- `docs/` — `CLAUDE.md`, `UI_CONTEXT.md`, `PROGRESS.md`, `STANDARDS.md` (this file). Anything humans need to read.
- `scripts/` — One-off operational scripts. Migrations, data backfills, manual jobs. Document each one with a header comment explaining when to run it.
- `tests/` — Test files mirror the structure of the code they test. Co-located tests (`foo.test.ts` next to `foo.ts`) are also acceptable for unit tests of a single file.