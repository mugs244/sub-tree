# Architecture Context

## Stack

| Layer            | Technology                              | Role                                                                          |
| ---------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| Framework        | Next.js 14 (App Router) + TypeScript    | Server-rendered React, file-based routing, API route handlers, server actions |
| UI               | Tailwind CSS + shadcn/ui                | Utility-first styling and accessible component primitives                     |
| Fonts            | Geist Sans + Geist Mono via `next/font` | Optimized self-hosted fonts with zero layout shift                            |
| Auth             | Custom (httpOnly cookies + argon2id)    | Phone-OTP and email-soft-verified sessions; no third-party auth provider      |
| Database         | PostgreSQL 16 + Prisma ORM              | Source of truth for users, links, profiles, donations, financial records      |
| Cache / Ephemeral | Redis (Upstash in prod, Docker local)  | OTP storage with TTL, rate-limit counters, idempotency keys, session cache    |
| SMS              | Africa's Talking                        | OTP delivery, donation alerts to creators                                     |
| Mobile Money     | MTN MoMo Collections API + Airtel Money Collections API | Donation collection via STK push, webhook-based confirmation                 |
| Email            | Resend (or Postmark)                    | Transactional email: verification, receipts, password reset                   |
| File Storage     | Cloudflare R2                           | User avatars, custom backgrounds, exported CSVs                               |
| Validation       | Zod                                     | Runtime validation at every system boundary                                   |
| Logging          | Pino                                    | Structured JSON logs                                                          |
| Hosting          | Vercel (app) + Neon or Supabase (DB)    | Edge-deployed Next.js with managed Postgres                                   |
| CDN / DNS        | Cloudflare                              | DNS, edge caching for public profile pages, DDoS protection                   |
| Domain registrar | Cloudflare Registrar (`.com`) + Ugandan registrar (`.ug`) | At-cost domain registration with WHOIS privacy                            |
| Analytics        | Plausible or PostHog (self-hosted)      | Page views, link clicks, conversion tracking — privacy-friendly               |
| Background jobs  | Vercel Cron + Inngest (if needed later) | Scheduled tasks: cleanup of expired OTPs, aggregation jobs, payout retries    |

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

- **Authentication is phone-first.** Every user signs up with phone + email + password + username. Phone is hard-verified via 6-digit OTP from Africa's Talking before the account becomes usable for public-facing or money-related actions. Email is soft-verified — gates donation enablement and payout but not page creation.

- **Sessions are server-managed.** On successful login, the server issues an opaque session token, stores the session record in Postgres (or Redis with Postgres fallback), and sets it as an httpOnly Secure SameSite=Lax cookie. The cookie name and contents never reveal user identity — only the session lookup ID.

- **Passwords are hashed with argon2id.** Never stored or transmitted in plaintext after the moment they leave the form. The hash includes per-user salt and tuned cost parameters reviewed periodically.

- **Every resource has a single owner.** A profile has one user_id. A link belongs to one user. A donation has both a recipient_user_id (the creator) and a supporter identifier (phone, optionally anonymous). There is no concept of shared ownership or collaborators at MVP.

- **Authorization is checked at the service layer, not in the route handler alone.** The route handler verifies the session exists; the service function verifies the session's user_id matches the resource owner before any mutation. This double-check prevents a forgotten guard at the route level from leaking ownership boundaries.

- **Public profile pages are unauthenticated** but read-only and rate-limited. Anyone can view `sub-tree.com/username`. Page views and link clicks are tracked anonymously (no PII captured beyond IP-based country derivation, which is then discarded after aggregation).

- **The donation flow is unauthenticated.** A donor doesn't need an account — they enter their phone and amount, approve the STK push, and they're done. The donor's phone is stored on the donation record for receipt purposes but is not converted into a Sub-tree account without explicit signup.

- **Admin actions** (reviewing reserved username claims, approving business/NGO KYB, manually refunding donations) require an internal admin role flag on the user record and are gated by route-level middleware checking that flag. Admins are humans we trust, not customers — initially just Muhamad.

- **Rate limits are enforced per phone, per IP, and per session** as appropriate to the endpoint. Signup: 5/hour per IP, 3/day per phone. OTP verify: 5 attempts per phone per 15 minutes (then lock). Donation initiation: 10/minute per donor phone. Bypass requires being on an allowlist (internal testing only).

- **Webhook endpoints are not session-authenticated.** They authenticate via signature verification against the provider's signing secret. An unsigned or invalid-signature webhook is dropped immediately, logged, and rate-limited per source IP.

## Invariants

1. **Request handlers do not run long-lived background work.** Anything taking more than a few hundred milliseconds (sending SMS, dispatching a MoMo STK push, processing a webhook event downstream) is queued or fired-and-forgotten with a result handler. The HTTP response returns fast and the work continues asynchronously. No `await` on a third-party API blocks a user-facing response unless the response literally depends on it.

2. **Financial records are append-only.** Donations, donation_events, payouts, and fee records are never updated and never deleted. Status transitions happen via new event rows referencing the original donation. The original record is immutable. This is the audit trail and the legal record — modifying it is a bug, not a feature.

3. **Money flows are idempotent end-to-end.** Every donation request from a client carries an idempotency key. Every webhook from MTN or Airtel carries a transaction reference. Duplicate requests with the same idempotency key return the original result without re-charging. Duplicate webhooks with the same transaction reference are recognized and short-circuited. Under no circumstance does a single donor PIN-approval result in two charges or two recorded donations.

4. **Validation happens at every system boundary.** User input is parsed with Zod at the route handler before reaching service code. Webhook payloads are parsed with Zod after signature verification. Environment variables are parsed at boot. Database results are typed by Prisma. After a boundary, the type is the contract — internal code does not re-validate trusted data.

5. **Authorization is checked before every mutation.** Reading public data (a profile page) requires no check. Mutating any user-owned resource requires the service to verify the session's user_id matches the resource's owner. There is no "trusted internal route" that skips this — even admin endpoints check the admin flag explicitly.

6. **PII is masked in logs and never logged in full.** Phone numbers log as `256-7XX-XXX-NNN` with the last 3 digits redacted. Emails log as `m***@example.com`. OTPs, PINs, passwords, MoMo transaction tokens, and session cookies never appear in logs under any circumstances. A grep for `password` or `otp` across all logs must return zero results.

7. **Direct settlement of donations means we never hold customer funds.** Donations route from the donor's MoMo wallet to the creator's registered MoMo number via the provider's API, with the platform fee split off at the API level. The Sub-tree corporate account does not pool donations and pay creators on a schedule — funds never sit in our control. This is a regulatory boundary, not a preference.

8. **Schema changes go through Prisma migrate, always.** No raw `ALTER TABLE` on the live database, no schema drift between environments, no "I'll just add this column quickly." A migration is reviewed, committed, and applied via the migration tool. Database state is recoverable from `db/migrations/` plus the latest backup at any time.

9. **Reserved usernames are enforced at write time, not at read time.** The check against the `reserved_usernames` table happens during signup before the user record is created. Once a username is held by a user, the reserved-list check is moot — the uniqueness constraint on `users.username` takes over. A reserved word freed by admin action becomes available for first-come, first-served claim.

10. **The MVP runs without the broader Muhamad ecosystem.** Sub-tree does not depend on the KYC verification layer, the EFRIS aggregator, the property/realtor systems, or any other ecosystem component at launch. Hooks for future integration are designed (clean service boundaries, abstract interfaces where useful), but no runtime dependency exists. Sub-tree must be able to ship and operate as a standalone product.

11. **Public profile pages must render under 1 second on 3G.** Server-rendered HTML, minimal client JS, images optimized via Next.js Image, CDN-cached at Cloudflare. Performance is a feature in this market — a 4-second profile page costs more donations than a missing theme does.

12. **Every feature change updates `PROGRESS.md` in the same commit.** The progress log is part of the source tree, not a separate doc. The repo and the running log of "where we are" stay in lockstep. A commit that changes code but not progress is incomplete.