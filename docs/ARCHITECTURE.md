# Architecture Context

## Stack

| Layer            | Technology                              | Role                                                                          |
| ---------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| Framework        | Next.js 16.2.6 (App Router) + TypeScript | Server-rendered React, file-based routing, API route handlers, server actions. `proxy.ts` replaces `middleware.ts` in this version. `params` are Promises. |
| UI               | Tailwind CSS v4 + shadcn/ui             | Utility-first styling. All tokens in `app/globals.css` under `@theme inline` — **no `tailwind.config.ts`**. `sonner` replaces deprecated shadcn `toast`. |
| Fonts            | Geist Sans + Geist Mono via `next/font` | Optimized self-hosted fonts with zero layout shift                            |
| Auth             | Clerk v7 (`@clerk/nextjs ^7.3.7`) — production instance | Phone OTP, email verification, sessions, password reset. JS proxy at `app/__clerk/[[...path]]/route.ts` via `createFrontendApiProxyHandlers()`. Webhooks verified with Svix (`svix-id`, `svix-timestamp`, `svix-signature` headers). |
| Database         | PostgreSQL + Prisma v7 ORM              | Hosted on Render. Schema at `db/schema.prisma`, config at `prisma.config.ts`. `postinstall: prisma generate` runs on Vercel. |
| Rate Limiting    | In-memory sliding window (Map) — `lib/rateLimit.ts` | Single-instance counters. Documented technical debt: replace with Upstash Redis for multi-instance scale. |
| Payments — Primary | **Pesapal** + **OpenFloat** (aggregators) | Active payment rails. Pesapal is BoU-licensed; covers MTN, Airtel, M-Pesa, and card across East Africa. OpenFloat is Uganda-focused, modern API. Both integrations are pending — direct clients currently on the active path until aggregator integration ships. |
| Payments — Fallback | MTN MoMo Collections + Airtel Money Collections (direct) | Existing direct integration in `lib/services/momo/mtn.ts` and `lib/services/momo/airtel.ts`. Kept as fallback for the scenario where aggregators are unavailable, fees change, or higher volume justifies direct relationships. NOT the active code path once aggregators ship. |
| SMS — Donation Notifications | Africa's Talking (`africastalking@0.7.9`) | "You received UGX X" alerts to creators after successful donations. API key configured. Feature 17 not yet wired. |
| Email            | Clerk built-in                          | Transactional auth emails handled by Clerk; product emails deferred          |
| File Storage     | Vercel Blob — pending Vercel Pro plan   | User avatars, exported CSVs. Currently avatar stored as pasted URL. Add `@vercel/blob` + `BLOB_READ_WRITE_TOKEN` when Vercel Pro is active. |
| Validation       | Zod v4 (`^4.4.3`)                       | Runtime validation at every system boundary                                   |
| Logging          | `console.error` at MVP                  | Replace with Pino structured logger before production scale                   |
| Hosting          | Vercel (app) + Render Postgres (DB)     | Live at `sub-tree.vercel.app`. Production branch: `feature/03-clerk-auth` (technical debt — should be `main`). |
| CDN / DNS        | Cloudflare (planned)                    | DNS, edge caching for public profile pages, DDoS protection                   |
| Domain registrar | Not yet registered                      | Target: `sub-tree.com` (Cloudflare Registrar) + `sub-tree.ug` (Ugandan registrar) |
| Analytics        | Built-in view + click counters          | `view_count` on Profile, `clicks` on Link, `referrer_source` on Donation. External analytics tool deferred. |
| Background jobs  | None at MVP                             | Vercel Cron or Trigger.dev when async volume justifies it (see `pending-dependencies.md`) |

## System Boundaries

- `app/` — Next.js App Router. Owns URL structure, page rendering, layouts, route handlers.
- `app/api/webhooks/` — Inbound webhook endpoints. Owns signature verification, idempotency, and dispatching events.
- `components/` — Domain UI components specific to Sub-tree.
- `components/ui/` — shadcn/ui primitives. Generated, not authored.
- `components/brand/` — Logo and brand assets.
- `components/layouts/` — Page layout wrappers (DashboardLayout etc).
- `lib/services/` — Business logic. `username.ts`, `profile.ts`, `link.ts`, `donation.ts`, `admin.ts`.
- `lib/services/momo/` — Direct MTN + Airtel clients (fallback path).
- `lib/services/payments/` — **Planned**: aggregator clients (Pesapal, OpenFloat) — to be built.
- `lib/validators/` — Zod schemas. `username.ts`, `profile.ts`, `link.ts`, etc.
- `lib/rateLimit.ts` — In-memory sliding window rate limiter.
- `lib/db.ts` — Prisma client singleton. Deferred init via `?? ""` to allow build-time access without `DATABASE_URL`.
- `lib/utils/platform.ts` + `components/PlatformIcon.tsx` — URL → platform detection (19 platforms supported).
- `db/` — Prisma schema, migrations, seed scripts. `db/schema.prisma` is the single source of truth.
- `types/` — Shared TypeScript types not tied to a specific domain.
- `public/` — Static assets.
- `docs/` — Operating documents: `CLAUDE.md`, `PROJECT-OVERVIEW.md`, `ARCHITECTURE.md`, `UI_CONTEXT.md`, `STANDARDS.md`, `WORKFLOW.md`, `PROGRESS.md`, `features-specs.md`, `pending-dependencies.md`.
- `scripts/` — One-off operational scripts.

## Storage Model

- **PostgreSQL (Prisma)** — Source of truth. All persistent business state: users, profiles, links, donations, donation events, reserved usernames, username claims, profile theme, view counts, click counts, referrer attribution, notification read state. Hosted on Render.

- **In-memory (`lib/rateLimit.ts`)** — Ephemeral rate-limit counters via JavaScript Map. Single-instance only. Resets on deploy. Documented as MVP-acceptable; production scale requires Upstash Redis migration.

- **Vercel Blob (planned)** — Will hold user avatars and exported CSVs once Vercel Pro is active. Until then, avatar field stores a pasted external URL (e.g., from a creator's existing social account).

- **Logs (Vercel runtime logs)** — `console.error` at MVP. Pino structured logger is the documented upgrade path. PII is not logged.

- **Client storage (browser)** — `localStorage` for non-sensitive UI preferences only. `sessionStorage` for `st_referrer` (referrer attribution between profile page and donation page). Authentication uses Clerk httpOnly cookies — never localStorage tokens.

## Auth and Access Model

- **Authentication is handled by Clerk** (production keys live). Every user signs up with phone + email + password via Clerk's hosted components. Clerk handles phone OTP verification, email verification links, session cookies, password reset, and account recovery. We do not write or maintain any auth code beyond the Clerk integration and the webhook handler that syncs Clerk users to our database.

- **Phone OTP is the primary verification method**, configured in the Clerk dashboard. Email is collected at signup and verified asynchronously via Clerk's email link flow.

- **Sessions are managed by Clerk.** Clerk issues httpOnly session cookies. The session token is opaque, scoped to our domain, and revocable from the Clerk dashboard.

- **Our database holds username, profile, and product data — Clerk holds identity.** The Clerk user ID (`clerk_user_id`) is the foreign key into our `User` table. Username, account type, links, donations, profile theme, and all product state live in Postgres. Authentication state lives in Clerk.

- **Every resource has a single owner.** A profile has one `user_id`. A link belongs to one user. There is no concept of shared ownership at MVP. (Note: this invariant will be revised for v2 Content Houses.)

- **Authorization is checked at the service layer.** Route handlers call Clerk's `auth()` helper to get the signed-in user, then service functions verify ownership before any mutation.

- **Public profile pages are unauthenticated** (`sub-tree.com/[username]`). The donation flow is unauthenticated — donors do not need a Clerk account.

- **Webhook endpoints authenticate via signature verification.** Clerk webhooks via Svix signature (`svix-id`, `svix-timestamp`, `svix-signature`). MTN and Airtel webhooks via HMAC-SHA256 of raw body against shared secret. Pesapal/OpenFloat webhook signature verification to be added when aggregator clients ship.

- **Admin role is a custom claim** controlled via the `ADMIN_CLERK_USER_IDS` environment variable (comma-separated). Admin routes are gated by `lib/services/admin.ts#isAdmin()` and middleware matches `/admin/(.*)` and `/api/admin/(.*)`.

- **Rate limits enforced via `lib/rateLimit.ts`** (in-memory, sliding window). Donation initiation: 3 attempts per phone per 10 minutes, returns 429 with `Retry-After`. Auth-related rate limits handled by Clerk.

## Invariants

1. **Request handlers do not run long-lived background work.** Anything taking more than a few hundred milliseconds (sending SMS, dispatching a MoMo STK push, processing a webhook event downstream) is queued or fired-and-forgotten with a result handler.

2. **Financial records are append-only.** Donations and donation events are never updated destructively. Status transitions happen via new `DonationEvent` rows referencing the original `Donation`. The original record is immutable.

3. **Money flows are idempotent end-to-end.** Every donation initiate request creates a record with an `idempotency_key`. Every webhook from MoMo (direct or aggregator) carries a transaction reference. Duplicate webhooks with the same transaction reference short-circuit to the original result. `handleMomoCallback` in `lib/services/donation.ts` enforces this.

4. **Validation happens at every system boundary.** Zod schemas validate every API input, every webhook payload (after signature verification), and every form submission. After parsing, the type is the contract.

5. **Authorization is checked before every mutation.** Reading public data (a profile page) requires no check. Mutating any user-owned resource requires the service to verify the session's user maps to the resource's `user_id`. Admin routes additionally check `isAdmin`.

6. **Most auth PII is owned by Clerk and never passes through our logs.** Phone numbers, emails, verification status, and session tokens are handled by Clerk. Our logs only record non-sensitive masked product identifiers. OTPs, passwords, and auth tokens never appear in app logs.

7. **Clerk is the source of truth for identity.** User authentication state — passwords, phone verification status, email verification status, session validity — lives in Clerk. Our database stores product data linked to Clerk users via `clerk_user_id`.

8. **Direct settlement of donations means we do not pool customer funds.** Donations route from the donor's MoMo wallet to the creator's registered MoMo number via the provider's API (Pesapal, OpenFloat, or direct MTN/Airtel as fallback), with the platform fee split off at the provider level. The Sub-tree corporate account does not hold donations on a schedule. This is a regulatory boundary, not a preference.

9. **Schema changes go through Prisma migrate, always.** No raw `ALTER TABLE` on the live database. Migrations live in `db/migrations/` and are immutable once applied.

10. **Reserved usernames are enforced at write time, not at read time.** The check against the `ReservedUsername` table happens during onboarding before the user's `username` is set. Once a username is held, the uniqueness constraint on `User.username` takes over. Reserved-username claims are queued in `UsernameClaim` and require admin approval (`lib/services/admin.ts`).

11. **The MVP runs without the broader Muhamad ecosystem.** Sub-tree does not depend on the KYC verification layer, the EFRIS aggregator, or any other ecosystem component. Hooks for future integration are designed via clean service boundaries.

12. **Public profile pages must render under 1 second on 3G.** Server-rendered HTML, minimal client JS, images optimized via Next.js Image, CDN-cached at Cloudflare (when configured). `app/[username]/page.tsx` is a server component.

13. **Every feature change updates `PROGRESS.md` in the same commit.** The progress log is part of the source tree, not a separate doc.

## Technical Debt (called out explicitly)

These are known compromises with planned resolution:

- **Production branch is `feature/03-clerk-auth`, not `main`.** Should be merged into `main` and `main` set as Vercel's production branch. Five-minute migration.
- **Rate limiting is in-memory.** Resets on deploy and doesn't sync across Vercel instances. Upgrade to Upstash Redis before scale matters.
- **`lib/services/momo/*` is on the active payment path.** Will become fallback once Pesapal + OpenFloat are integrated. Direct clients stay for resilience but not as the primary route.
- **Avatar is a pasted URL field.** Becomes Vercel Blob upload once Vercel Pro is active.
- **`console.error` is the logger.** Replace with Pino before production scale.
- **The `context/` directory exists at project root but is empty.** All actual context files live in `docs/`. `CLAUDE.md` references `context/*.md` paths but the canonical location is `docs/*.md`. Either move docs into `context/` or update `CLAUDE.md` paths — currently a routing inconsistency.
