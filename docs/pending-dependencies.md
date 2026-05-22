# Pending Dependencies

Tools and services evaluated for Sub-tree but not currently in the codebase. This document captures the decision, trigger conditions, and install notes so we do not re-evaluate the same options every time.

When a dependency is installed, update `docs/ARCHITECTURE.md` and `docs/PROGRESS.md` in the same commit and remove the entry from this file.

---

## Liveblocks

**What:** Realtime collaboration infrastructure for multiplayer cursors, presence, shared state, and live comments.

**Use case for Sub-tree:** Content Houses (v2 Feature 36) where multiple users edit one profile simultaneously.

**Why deferred:** No multi-user resources exist at MVP. The single-owner invariant holds at v1.

**Install when:**
- v2 Feature 36 (Content Houses) is greenlit for build
- MVP has shipped and accumulated 6+ months of usage
- At least one content house has requested team functionality

**Install command:** `npm install @liveblocks/client @liveblocks/react @liveblocks/react-comments`

---

## Trigger.dev

**What:** Background job orchestration and async worker platform.

**Use case for Sub-tree:** Async workflows that exceed safe request/response lifecycle — webhook reconciliation at scale, email receipts, retryable payouts, scheduled aggregations.

**Why deferred:** MVP can handle async work with simple server handlers and direct-from-route processing. Trigger.dev adds operational overhead worth justifying only at real volume.

**Install when:**
- Donation/webhook volume exceeds what lightweight handlers can reliably support
- A concrete workflow exists that cannot be safely handled in-request
- Reliability or developer-velocity gain clearly justifies the dependency

**Install command:** `npm install @trigger.dev/sdk @trigger.dev/nextjs`

---

## Upstash Redis

**What:** Serverless Redis. Replacement for the in-memory rate limiter (`lib/rateLimit.ts`).

**Use case for Sub-tree:** Multi-instance rate limiting that survives deploys and works across all Vercel function instances.

**Why deferred:** Single-instance, in-memory rate limiting is sufficient at MVP traffic. Documented as accepted technical debt in ARCHITECTURE.md.

**Install when:**
- Sub-tree runs on more than one Vercel function instance regularly (typical of moderate traffic)
- Rate-limit bypass becomes observable in production (counters resetting on deploy is exploited)
- 1,000+ active creators

**Install command:** `npm install @upstash/redis @upstash/ratelimit`

---

## Vercel Blob

**What:** Vercel's blob storage product for file uploads.

**Use case for Sub-tree:** Profile picture uploads (currently a pasted URL field), exported CSVs, custom backgrounds for Pro creators.

**Why deferred:** Requires Vercel Pro plan. MVP works with pasted-URL avatars.

**Install when:** Vercel Pro plan is active.

**Install command:** `npm install @vercel/blob`

**Setup:** Add `BLOB_READ_WRITE_TOKEN` to Vercel env vars. Replace avatar URL text field with `<input type="file">` + `put()` call from `@vercel/blob`.

---

## Pino (structured logging)

**What:** Fast JSON logger with structured fields and consistent shape.

**Use case for Sub-tree:** Replacing the current `console.error` pattern with structured logs that can be ingested by Axiom, Datadog, or similar.

**Why deferred:** `console.error` is sufficient for MVP debugging via Vercel's runtime log view.

**Install when:**
- Production runtime issues need investigation beyond what raw Vercel logs provide
- Log ingestion service is signed up for (Axiom recommended)
- Sub-tree has paying customers whose issues need traceability

**Install command:** `npm install pino pino-pretty`

---

## Pesapal + OpenFloat (payment aggregators)

**Status:** Decided, integration pending.

**What:** East African payment aggregators that wrap MTN MoMo, Airtel Money, M-Pesa, cards, and bank transfers behind a single API. Pesapal is licensed by Bank of Uganda as a payment service provider.

**Why these are not "deferred" but "pending integration":** They have been decided as the active payment rails for v1 launch. The direct MTN and Airtel clients (`lib/services/momo/`) remain as fallback.

**Integration scope (a near-term feature, not deferred):**
- New service files under `lib/services/payments/pesapal.ts` and `lib/services/payments/openfloat.ts`
- Both implement the `MomoProvider` interface so the existing route handler in `/api/payments/initiate` can swap providers cleanly
- Webhook routes at `/api/webhooks/payments/pesapal` and `/api/webhooks/payments/openfloat` with their respective signature verification
- Provider selection logic: aggregator-first, direct as fallback if aggregator fails

**Install:** No npm package; both providers expose REST APIs and HMAC-signed webhooks. Use `fetch`.

---

## Process

1. Before installing any new package or service, check this file.
2. If a dependency is already listed, follow its trigger conditions rather than re-evaluating.
3. If the dependency is new and anticipatory, add it here with the same format.
4. When you install, update `docs/ARCHITECTURE.md` + `docs/PROGRESS.md` in the same commit and delete the entry here.
