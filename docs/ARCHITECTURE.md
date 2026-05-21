# Architecture Context

## Stack

| Layer            | Technology                              | Role                                                                          |
| ---------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| Framework        | Next.js 16.2.6 (App Router) + TypeScript | Server-rendered React, file-based routing, API route handlers, server actions. `proxy.ts` replaces `middleware.ts` in this version. `params` are Promises. |
| UI               | Tailwind CSS v4 + shadcn/ui             | Utility-first styling. All tokens in `app/globals.css` under `@theme inline` — no `tailwind.config.ts`. |
| Fonts            | Geist Sans + Geist Mono via `next/font` | Optimized self-hosted fonts with zero layout shift                            |
| Auth             | Clerk v7 (`@clerk/nextjs ^7.3.7`) — production instance | Phone OTP, email verification, sessions, password reset. JS proxy at `app/__clerk/[[...path]]/route.ts` via `createFrontendApiProxyHandlers()`. Webhooks verified with Svix (`svix-id`, `svix-timestamp`, `svix-signature` headers). |
| Database         | PostgreSQL + Prisma v7 ORM              | Hosted on Render. Schema at `db/schema.prisma`, config at `prisma.config.ts`. `postinstall: prisma generate` runs on Vercel. |
| Cache / Ephemeral | In-memory sliding window (Map) — `lib/rateLimit.ts` | Rate-limit counters at MVP. Upgrade path: Upstash Redis for multi-instance. Redis not yet provisioned. |
| SMS — Donation Notifications | Africa's Talking (`africastalking@0.7.9`) | "You received UGX X" alerts to creators after successful donations. API key configured. Feature 17 not yet wired. |
| Email            | Clerk built-in                          | Transactional auth emails handled by Clerk; product emails deferred          |
| Mobile Money     | MTN MoMo Collections API + Airtel Money Collections API | Donation collection via STK push, webhook-based confirmation. Clients built (`lib/services/momo/`), credentials pending. |
| File Storage     | Vercel Blob (planned — pending Pro plan) | User avatars, exported CSVs. Currently avatar stored as pasted URL. Add `@vercel/blob` + `BLOB_READ_WRITE_TOKEN` when Vercel Pro is active. |
| Validation       | Zod v4 (`^4.4.3`)                       | Runtime validation at every system boundary                                   |
| Logging          | `console.error` at MVP                  | Replace with Pino structured logger before production scale                   |
| Hosting          | Vercel (app) + Render Postgres (DB)     | Production branch: `feature/03-clerk-auth`. Live at `sub-tree.vercel.app`.   |
| CDN / DNS        | Cloudflare (planned)                    | DNS, edge caching for public profile pages, DDoS protection                   |
| Domain registrar | Not yet registered                      | Target: `sub-tree.com` (Cloudflare Registrar) + `sub-tree.ug` (Ugandan registrar) |
| Analytics        | Built-in view + click counters          | `view_count` on Profile, `clicks` on Link. External analytics tool deferred. |
| Background jobs  | None at MVP                             | Vercel Cron or Trigger.dev when async volume justifies it (see `pending-dependencies.md`) |

## System Boundaries

- `app/` — Next.js App Router. Owns URL structure, page rendering, layouts, route handlers. Pages are thin shells that compose components and call services; routes are thin handlers that validate input and call services.
- `app/api/webhooks/` — Inbound webhook endpoints. Owns signature verification, idempotency, and dispatching events into the system. Knows nothing about business logic — hands off to `lib/services/`.
- `components/` — Domain UI components specific to Sub-tree (LinkCard, DonationSheet, UsernameInput, ProfilePreview). Owns presentation. Knows nothing about the database or external APIs.
- `components/ui/` — shadcn/ui primitives. Generated, not authored. Owns base building blocks (Button, Input, Dialog). Never modified directly.
- `lib/services/` — Business logic. Owns the "what happens when" of every domain operation: signup, donation processing, link management. Composes lower-level utilities (db, redis, momo) into use-case-shaped functions. Single entry point per domain.
- `lib/validators/` — Zod schemas. Owns input shape definitions used by API routes and forms. Single source of truth for what valid input looks like.
- `lib/momo/` — Mobile money provider integrations. Owns the dialect of talking to MTN and Airtel APIs (request signing, response parsing, error mapping). Exposes a provider-agnostic interface to services.
- `lib/sms.ts` — SMS abstraction. Owns the contract between the app and an SMS provider. Africa's Talking is the default implementation; alternate providers slot in without service-layer changes.
- `lib/auth/` — Session, password hashing, OTP generation/verification, cookie management. Owns the cryptographic primitives — every other layer asks `auth` for "is this user logged in" rather than checking cookies directly.
- `lib/db.ts` — Prisma client singleton. Owns connection lifecycle. Every database call in the app imports from here.
- `lib/redis.ts` — Redis client singleton. Same pattern as `db.ts`.
- `lib/logger.ts` — Structured logger setup. Owns log formatting and transport configuration.
- `db/` — Prisma schema, migrations, seed scripts. Owns the data model. Schema changes always go through Prisma migrate, never raw SQL on the live database.
- `types/` — Shared TypeScript types not owned by a specific domain (Session, ApiResponse, ErrorCode enums).
- `public/` — Static assets served directly: favicons, OG fallback images, robots.txt, sitemap.
- `docs/` — Operating documents: `CLAUDE.md`, `UI_CONTEXT.md`, `STANDARDS.md`, `PROGRESS.md`, `ARCHITECTURE.md` (this file). Owns the project's institutional memory.
- `scripts/` — One-off operational scripts: backfills, data migrations outside Prisma, manual jobs. Each script has a header explaining when to run it and what it does.

## Storage Model

- **PostgreSQL (Prisma)** — Source of truth. All persistent business state: users, profiles, links, reserved usernames, account types, subscriptions, donations, donation events, payout records, audit logs. Metadata, ownership, relationships, financial records. Anything that survives a server restart and matters for correctness.

- **Redis** — Ephemeral state with TTL. OTPs (10-minute expiry), rate-limit counters (sliding-window per phone/IP), idempotency keys for payment requests (24-hour retention), session cache for hot-path session lookups, soft-reservation of usernames during signup (15-minute hold). Never the source of truth — if Redis is wiped, the app degrades gracefully (rate limits reset, in-flight signups can be retried).

- **Cloudflare R2 (Blob Storage)** — Large binary content. User-uploaded avatars, custom profile backgrounds (Pro tier), exported transaction CSVs, generated OG images for public pages. The database stores the R2 URL or key; the binary itself never sits in Postgres.

- **Logs (Vercel + external sink later)** — Structured JSON logs streamed via Pino. Short-term in Vercel's log view; longer-term shipped to a dedicated sink (Axiom, Datadog, or similar) once volume justifies it. PII is masked at log site, not in the sink.

- **Client storage (browser)** — `localStorage` is used only for non-sensitive UI preferences (last-selected country code, dashboard sidebar collapsed state). Authentication uses httpOnly cookies — never localStorage tokens. No sensitive data in browser storage, ever.

## Auth and Access Model

- **Authentication is handled by Clerk.** Every user signs up with phone + email + password + username via Clerk's components. Clerk handles phone OTP verification, email verification links, session cookies, password reset, and account recovery. We do not write or maintain any auth code beyond the Clerk integration.

- **Phone OTP is the primary verification method.** Clerk's signup flow is configured to require phone verification before account activation. Email is collected at signup and verified asynchronously via Clerk's email link flow.

- **Sessions are managed by Clerk.** Clerk issues httpOnly session cookies on signed-in users. The session token is opaque, scoped to our domain, and revocable from the Clerk dashboard. We never store or rotate passwords ourselves.

- **Our database holds username, profile, and business data — Clerk holds identity.** The Clerk user ID (`clerk_user_id`) is the foreign key into our users table. Username, account type, links, donations, and all product state live in Postgres. Authentication state lives in Clerk.

- **Every resource has a single owner.** A profile has one user_id (which maps to one clerk_user_id). A link belongs to one user. There is no concept of shared ownership at MVP.

- **Authorization is checked at the service layer.** Route handlers call auth() from Clerk's Next.js SDK to get the signed-in user. The service layer then verifies the user owns the resource being mutated.

- **Public profile pages are unauthenticated.** Anyone can view sub-tree.com/username. Clerk middleware is configured to skip auth requirements for public routes.

- **The donation flow is unauthenticated.** A donor doesn't need a Clerk account.

- **Webhook endpoints authenticate via signature verification.** Clerk webhooks via Clerk's signing secret, MTN/Airtel webhooks via their respective secrets.

- **Admin role is a custom claim on the Clerk user.** Admin actions check `sessionClaims.metadata.role === "admin"` via Clerk's middleware. Admins are managed manually through Clerk's dashboard at MVP.

- **Rate limits are enforced per phone, per IP, and per session** as appropriate to the endpoint. Signup: 5/hour per IP, 3/day per phone. Donation initiation: 10/minute per donor phone. Bypass requires being on an allowlist (internal testing only).

## Invariants

1. **Request handlers do not run long-lived background work.** Anything taking more than a few hundred milliseconds (sending SMS, dispatching a MoMo STK push, processing a webhook event downstream) is queued or fired-and-forgotten with a result handler. The HTTP response returns fast and the work continues asynchronously. No `await` on a third-party API blocks a user-facing response unless the response literally depends on it.

2. **Financial records are append-only.** Donations, donation_events, payouts, and fee records are never updated and never deleted. Status transitions happen via new event rows referencing the original donation. The original record is immutable. This is the audit trail and the legal record — modifying it is a bug, not a feature.

3. **Money flows are idempotent end-to-end.** Every donation request from a client carries an idempotency key. Every webhook from MTN or Airtel carries a transaction reference. Duplicate requests with the same idempotency key return the original result without re-charging. Duplicate webhooks with the same transaction reference are recognized and short-circuited. Under no circumstance does a single donor PIN-approval result in two charges or two recorded donations.

4. **Validation happens at every system boundary.** User input is parsed with Zod at the route handler before reaching service code. Webhook payloads are parsed with Zod after signature verification. Environment variables are parsed at boot. Database results are typed by Prisma. After a boundary, the type is the contract — internal code does not re-validate trusted data.

5. **Authorization is checked before every mutation.** Reading public data (a profile page) requires no check. Mutating any user-owned resource requires the service to verify the session's user_id matches the resource's owner. There is no "trusted internal route" that skips this — even admin endpoints check the admin flag explicitly.

6. **Most auth PII is owned by Clerk and never passes through our logs.** Phone numbers, emails, verification status, and session tokens are handled by Clerk; our logs only record non-sensitive, masked product identifiers. OTPs, passwords, and auth tokens never appear in app logs.

7. **Clerk is the source of truth for identity.** User authentication state — passwords, phone verification status, email verification status, session validity — lives in Clerk. Our database stores product data linked to Clerk users via `clerk_user_id`. We do not duplicate identity state.

8. **Direct settlement of donations means we never hold customer funds.** Donations route from the donor's MoMo wallet to the creator's registered MoMo number via the provider's API, with the platform fee split off at the API level. The Sub-tree corporate account does not pool donations and pay creators on a schedule — funds never sit in our control. This is a regulatory boundary, not a preference.

8. **Schema changes go through Prisma migrate, always.** No raw `ALTER TABLE` on the live database, no schema drift between environments, no "I'll just add this column quickly." A migration is reviewed, committed, and applied via the migration tool. Database state is recoverable from `db/migrations/` plus the latest backup at any time.

9. **Reserved usernames are enforced at write time, not at read time.** The check against the `reserved_usernames` table happens during signup before the user record is created. Once a username is held by a user, the reserved-list check is moot — the uniqueness constraint on `users.username` takes over. A reserved word freed by admin action becomes available for first-come, first-served claim.

10. **The MVP runs without the broader Muhamad ecosystem.** Sub-tree does not depend on the KYC verification layer, the EFRIS aggregator, the property/realtor systems, or any other ecosystem component at launch. Hooks for future integration are designed (clean service boundaries, abstract interfaces where useful), but no runtime dependency exists. Sub-tree must be able to ship and operate as a standalone product.

11. **Public profile pages must render under 1 second on 3G.** Server-rendered HTML, minimal client JS, images optimized via Next.js Image, CDN-cached at Cloudflare. Performance is a feature in this market — a 4-second profile page costs more donations than a missing theme does.

12. **Every feature change updates `PROGRESS.md` in the same commit.** The progress log is part of the source tree, not a separate doc. The repo and the running log of "where we are" stay in lockstep. A commit that changes code but not progress is incomplete.