# Code Standards

## General

- Keep modules small and single-purpose. If a file exceeds ~300 lines or describes more than one thing, split it.
- Fix root causes, do not layer workarounds. Document the root cause in the commit message when fixing recurring bugs.
- Do not mix unrelated concerns in one component or route.
- Write code that's obvious over code that's clever.
- No dead code, no commented-out blocks left "just in case." Git history is the safety net.
- Errors are not strings. Throw typed errors with enough context that the caller knows what failed.
- Comments explain *why*, not *what*.
- No premature abstraction. Build the concrete thing first. Extract a helper only when the second usage appears.
- Logging at MVP is `console.error` for errors, no `console.log` in committed code. Pino structured logging is the documented upgrade path.
- Every feature change touches `PROGRESS.md` in the same commit.

## TypeScript

- Strict mode is required. `"strict": true` plus `"noUncheckedIndexedAccess": true` and `"noImplicitOverride": true`. No exceptions.
- Avoid `any`. Use explicit interfaces, narrowly scoped types, or `unknown` for genuinely unknown shapes.
- Validate unknown external input with Zod at every system boundary before any logic runs.
- Discriminated unions over enums for state machines.
- Prefer `type` for unions and aliases, `interface` for object shapes that might be extended.
- No type assertions (`as Foo`) except at parse boundaries.
- Function signatures are explicit. Return types declared on exported functions.
- `null` for "intentionally absent" (DB column null), `undefined` for "not yet set" or "optional". Never mix them on the same property.

## Next.js (App Router) — version 16

- This is Next.js 16. `proxy.ts` is the modern equivalent of `middleware.ts`. Route `params` are Promises.
- Default to server components. Mark `"use client"` only when browser APIs are needed.
- Keep `"use client"` boundaries small. Interactive islands inside server pages.
- Route handlers (`route.ts`) do one thing. Separate routes for separate concerns.
- Use Server Actions for mutations triggered from server components when sensible; route handlers for client-component-triggered mutations and external callers (webhooks).
- File-based routing reflects URL structure. Route groups `(...)` organize without affecting URLs.
- Loading and error states are first-class. Every meaningful route segment has `loading.tsx` and `error.tsx`.
- Metadata defined per-route via `metadata` export. OG images generated via `opengraph-image.tsx` files (already shipped for profile pages).
- Environment variables: `NEXT_PUBLIC_*` for client-exposed, plain names for server-only.

## Styling — Tailwind v4

- Tailwind CSS v4 is in use. **There is no `tailwind.config.ts`.** All theme tokens live in `app/globals.css` under `@theme inline`. The CSS is the config.
- Use design tokens via CSS custom properties or Tailwind utilities that reference them (`bg-base`, `text-primary`, `border-default`). **No hardcoded hex values** in component files.
- Inline `var()` syntax is explicitly allowed where a token isn't mapped to a Tailwind utility. Example: `text-[color:var(--text-secondary)]` (used because `text-secondary` would collide with shadcn's `bg-secondary`).
- Follow the border radius scale: `rounded-lg` (buttons, inputs), `rounded-xl` (cards), `rounded-2xl` (modals/drawers), `rounded-full` (pills/badges).
- Tailwind utility classes over CSS modules. Exception: `app/globals.css` for tokens, focus-visible defaults, input color overrides (Tailwind v4 doesn't set form-element color by default).
- No inline `style` props except for genuinely dynamic values (creator's theme color, dynamic background images).
- Mobile-first: base styles target mobile, `md:`/`lg:` add desktop.
- `dark:` classes are forbidden at MVP. Dark mode is a Pro-tier v2 feature.
- shadcn `sonner` replaces deprecated `toast`. Same trigger API.

## API Routes

- Validate input with Zod before any logic. Return `400` with structured error on parse failure: `{ error: "VALIDATION_ERROR", fields: { ... } }`.
- Enforce auth via Clerk's `auth()` helper at the top of every protected route handler:
  ```ts
  const { userId } = await auth()
  if (!userId) return new Response("Unauthorized", { status: 401 })
  ```
- After auth, verify resource ownership at the service layer.
- Consistent response shapes. Success: `{ data: ... }`. Error: `{ error: "ERROR_CODE", message: "..." }`. HTTP codes match.
- Rate limit mutation endpoints via `lib/rateLimit.ts`. Donations: 3 per phone per 10 min. Returns 429 with `Retry-After`.
- Idempotency on payment routes. Donation initiate generates and stores `idempotency_key`; webhook callbacks dedupe on provider transaction reference.
- Webhooks verify signatures before processing. Clerk: Svix headers. MTN/Airtel direct: HMAC-SHA256. Pesapal/OpenFloat: per their respective signature schemes (to be added).
- Webhook handlers are async-safe and idempotent. Same webhook may fire multiple times — short-circuit duplicates.
- No business logic in route handler files. Route validates and calls service. Service does the work.
- Never log secrets, OTPs, PINs, full phone numbers, or transaction tokens. Mask PII in logs.

## Data and Storage

- Persistent data in Postgres via Prisma. Migrations only — no raw `ALTER TABLE`.
- We do not store passwords. Clerk owns auth state. Our `User` table stores `clerk_user_id` as the foreign key.
- Large or generated content in Vercel Blob (planned, pending Pro) — never in Postgres rows.
- Ephemeral state in memory (`lib/rateLimit.ts`) at MVP. Upstash Redis is the documented upgrade path.
- Financial data (`Donation`, `DonationEvent`) is append-only. Status changes are new event rows.
- Timestamps: `timestamptz` in Postgres, UTC stored, local time on frontend. Every table has `created_at`; mutable tables have `updated_at`.
- Soft delete for users (`deleted_at`); hard delete for ephemeral records.
- Foreign keys enforced at DB level. `ON DELETE CASCADE` for owned data; `ON DELETE RESTRICT` for financial references.
- Indexes are not optional. Index every FK, every `WHERE` column, every `ORDER BY` column.
- PII (phone, email, payout numbers) is handled carefully. Most lives in Clerk; what's in our DB is not logged in full.

## On Adding New Dependencies

1. Check `docs/pending-dependencies.md` first.
2. Ask: does the product actually need this *now*, or is it anticipatory? If anticipatory, add to `pending-dependencies.md` instead of installing.
3. If installing is needed, update `docs/ARCHITECTURE.md` stack table and `docs/PROGRESS.md` in the same commit.

## File Organization

- `app/` — Next.js routes, pages, layouts, route handlers.
- `app/(auth)/`, `app/(dashboard)/` — route groups (don't affect URL).
- `app/api/` — API route handlers, subfoldered by domain.
- `app/[username]/` — public profile and donation pages.
- `app/__clerk/[[...path]]/route.ts` — Clerk JS proxy (Vercel custom domain support).
- `components/ui/` — shadcn primitives. Never modified directly.
- `components/` — Sub-tree domain components.
- `components/brand/Logo.tsx` — brand mark.
- `components/layouts/` — DashboardLayout etc.
- `lib/services/` — Business logic per domain.
- `lib/services/momo/` — Direct MTN + Airtel clients (fallback path).
- `lib/services/payments/` — *(planned)* Pesapal + OpenFloat aggregator clients.
- `lib/validators/` — Zod schemas.
- `lib/db.ts` — Prisma client singleton.
- `lib/rateLimit.ts` — In-memory sliding window rate limiter.
- `lib/utils/platform.ts` — URL → platform detection.
- `db/schema.prisma` — single source of truth for data model.
- `db/migrations/` — Prisma migrations, immutable once applied.
- `db/seed.ts` — Seed data (reserved usernames).
- `types/` — shared TypeScript types.
- `public/` — static assets.
- `docs/` — all project documentation.
- `scripts/` — one-off operational scripts.
