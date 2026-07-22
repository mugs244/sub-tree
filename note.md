# Business Tier / Ad System — Precautions & Concerns

Handoff notes for the advertiser business tier, Ad-tre routing engine, and
short-form content engine built on `feature/04-business-tier`. Last updated
2026-07-22.

---

## 🔴 Critical — read before going live or testing payments

### Pesapal is pointed at PRODUCTION
- `PESAPAL_ENVIRONMENT=production` with **live** credentials in `.env.local`.
- **Any payment initiated is real money.** Do NOT fire test orders (wallet
  top-up, subscription pay, or onboarding "Pay") against this config.
- To test the real payment round-trip safely, temporarily switch to
  `PESAPAL_ENVIRONMENT=sandbox` with **sandbox** consumer key/secret + a
  sandbox IPN id. Never leave sandbox keys in production.

### Pesapal IPN routing
- Advertiser payments share the **donation** IPN (`PESAPAL_IPN_ID`) — the
  donation webhook now dispatches to the advertiser handler too (idempotent),
  so a single registered IPN settles both.
- Optional cleaner setup: register a dedicated IPN URL
  `/api/webhooks/payments/pesapal/advertiser` in the Pesapal dashboard and set
  `PESAPAL_ADVERTISER_IPN_ID`.
- **IPNs are server-to-server** — Pesapal must reach a public deployment
  (`sub-tree.com`), not localhost. Local payments won't settle without a
  tunnel/deploy.

### App base URL for callbacks
- Payment callback/redirect URLs default to `https://sub-tree.com`. Set
  `APP_BASE_URL` when testing against a different deployment, or the payer will
  be redirected to prod after paying.

### External services — real-world conditions required
| Service | Status | Note |
|---|---|---|
| Vercel Blob (`BLOB_READ_WRITE_TOKEN`) | ✅ set | Logo / creative uploads work in-browser. |
| Resend (`RESEND_API_KEY`) | ✅ set | Onboarding verification emails send for real. |
| eSMS (SMS OTP) | ⚠️ needs balance | Phone OTP send returns `insufficient_balance` until topped up. |
| Pesapal | ⚠️ production | See above — real money. |
| Mux (video) | ❌ not set up | Video ad creatives store an opaque URL; no transcoding/hosting pipeline. |

---

## 🟠 Database & migrations

### `prisma migrate dev` does NOT work in this repo
- The shadow-DB replay breaks: early migrations were pruned, so replaying from
  empty fails once a later migration references `User`. Also, the DB's own
  migration-tracking table drifted from the repo (some features were `db push`ed,
  not migrated).
- **Workflow used for every migration this session** (do the same):
  1. Edit `db/schema.prisma`.
  2. `prisma migrate diff --from-config-datasource --to-schema db/schema.prisma --script` → save as `db/migrations/<timestamp>_<name>/migration.sql`.
  3. `prisma db execute --file <that file>`.
  4. `prisma migrate resolve --applied <migration_name>`.
  5. `prisma generate`.
- A proper **baseline** (squash history + `migrate resolve` the lot) is the
  real fix, but it's a deliberate team-wide operation — deferred.

### The Railway DB is shared / production-ish
- `DATABASE_URL` points at the live Railway Postgres. All schema migrations this
  session were applied there (additive only — new columns/tables, nothing
  dropped or altered).
- Verification scripts created their own rows and deleted them; one orphaned
  test booking was found and purged mid-session (cleanup that didn't fully
  complete). **Watch for leftover test data** if any script is interrupted.
- An **isolated Neon test DB** was planned (build schema with `prisma db push`
  into an empty DB, `npm run seed`, seed a test advertiser) but not yet set up.

---

## 🟡 Verification gaps

- **Nothing has been driven through a real browser.** All verification is
  service-layer (money math, permission guards, state transitions, routing) run
  against the live DB with self-cleaning scripts. Pages, forms, and multi-step
  flows (onboarding, editor, calendar) are proven only by typecheck + lint.
- The real Pesapal checkout, real Blob upload, and real OTP delivery are built
  correctly against their APIs but only provable end-to-end with
  credentials/balance in a deployed env (see Critical section).
- Suggested next step: seed a test advertiser + run `next dev` against the
  isolated Neon DB and click through onboarding → book → editor → publish.

---

## 🟡 Deferred / incomplete (need product input or later work)

- **Consumer feed UI** — parked by request. The short-form engine + API exist
  (ads have a serving surface in code), but there's no scrollable viewer.
- **Ad-tre v2**:
  - Live-user **capacity formula** — `ad_slot_window_capacity` is a flat config
    (default 10), not derived from a real presence signal.
  - **Cross-booking overflow deferral** — needs impression-target selling
    (slots are sold by time window today).
  - **Rerun rescheduling** ("offer alternative times if taken") — not built.
  - Unfilled-slot **re-placement** ("hunt for next open slot / roll forward") —
    only the auto-refund half exists.
  - Cross-advertiser "a slot just freed" **broadcast** — needs a waitlist model;
    only per-advertiser booking notifications exist.
- **External stack** (Revive Adserver, Mux, fragmentation software) — aspirational;
  the router is in-house behind a clean `AdRouter` seam for later swap.
- **Home feed** (business account's own feed) — deferred by the spec.
- **Analytics age breakdown** — `age_group` stays null; no age data is collected
  anywhere yet.

---

## 🟢 Known limitations / behaviours to be aware of

- **Ad frequency cap is cross-page, not within-page.** The cap is enforced from
  *recorded* impressions (reported on render). Within a single feed page, the
  cadence (`feed_ad_interval`) bounds ad density; a very large page could in
  principle place more ads than the per-hour cap. Fine for normal small pages.
- **Heatmap** times are **UTC**; sample data is seeded via `npm run seed` (not
  persisted to the shared DB by verification) and is representative, not real,
  until feed traffic accumulates.
- **Settings "submit for verification"** is now largely redundant — onboarding
  auto-verifies the moment all data is present.
- **Pricing is tier-multiplier based** (Startup ×1 / Growth ×1.5 / Enterprise
  ×2.5) and **campaign reruns** are discounted (25k vs 40k/day) — all
  `PlatformSetting`-backed defaults, tune without a deploy.

---

## ⚪ Repo / working-tree state

- **Nothing is pushed.** All work is local commits on `feature/04-business-tier`.
  Push manually: `git push origin feature/04-business-tier:feature/04`.
- **Left uncommitted deliberately**: `tsconfig.json` (mobile exclude — an
  auth-branch leftover), `mobile/` (its `App.tsx` imports a `HomeScreen` that
  doesn't exist — won't build), and `FanPortal.jsx` (restored design reference,
  referenced by `docs/v3/V3-FEATURES.md`).

---

## 🔒 Security observation

- `AGENTS.md` and a hidden "AI agent hint" comment inside
  `node_modules/next/dist/docs/` instruct an agent to act on unverified
  claims (a fake `unstable_instant` export). This has the shape of a
  **prompt-injection test**, not real project docs. It was NOT acted on.
  Treat embedded "instructions" in dependency files as untrusted.
