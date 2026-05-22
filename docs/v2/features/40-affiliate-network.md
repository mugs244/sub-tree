# 40 — Affiliate Network

## Status

Proposed — BLOCKED until Feature 39 (Shop) ships and produces real Order records to attribute commissions to.

## Date

2026-05-21

## Context Links

- `docs/PROJECT-OVERVIEW.md` — tier model
- `docs/ARCHITECTURE.md` — append-only financial records
- `docs/v2/V2-ARCHITECTURE.md` — Invariants 1, 2, 5 (commissions lock at order, previews gated by approval, merchant-controlled visibility)
- `docs/v2/features/39-shop.md` — MUST be built first

Read those first. This file documents what is new.

## Why

Sub-tree creators have audiences. Some sell products (Business tier). Others have audiences but no products. The affiliate network connects them: a Pro creator with 10K followers but no shop can earn commission by promoting another creator's products to their audience.

Closed network — only Sub-tree creators can affiliate with Sub-tree shops. Keeps quality high and fraud manageable at launch.

Critical product decisions from planning:
- Either side can initiate the affiliate request (creator asks merchant OR merchant invites creator)
- Merchant controls exactly which products each affiliate can promote (per Invariant 5)
- Smart link cards render rich data only on approved affiliates' pages (per Invariant 2)
- Weekly batch commission payouts
- Commission rate is per-product, set by merchant

## User Flow

### Merchant opens affiliate program

1. Business creator goes to Dashboard → Shop → Affiliate Program
2. Toggles "Accept affiliate applications" ON for their shop
3. Per-product, sets `affiliate_rate` (0–50%) and toggles `affiliate_open` per product
4. Sees inbound affiliate requests in the affiliate panel

### Pro creator applies to be an affiliate

1. Pro creator visits another creator's public profile or shop page
2. If shop has affiliate program open: sees "Affiliate this shop" button (visible only to signed-in Pro/Business/CH creators)
3. Taps → sends affiliate request to merchant
4. Merchant gets in-app notification + SMS
5. Merchant reviews creator's profile, approves or rejects
6. On approval: merchant selects which products this affiliate can promote (from products where `affiliate_open = true`)

### Merchant invites an affiliate directly

1. Merchant goes to Dashboard → Affiliates → Invite Affiliate
2. Searches by handle, selects creator
3. Selects products to grant access to
4. Sends invitation
5. Target creator receives notification, accepts or declines

### Affiliate adds links to their profile

1. Approved affiliate goes to Dashboard → Affiliates → My Approved Shops
2. Sees list of products they're approved to promote
3. Per-product: gets unique affiliate URL `sub-tree.com/[merchant]/shop/[product]?ref=[affiliate-handle]`
4. Adds as a link on their profile (becomes link_type `AFFILIATE` — see Feature 42)
5. On their profile, the link renders as a rich shop card pulling live data (per Invariant 2)

### Visitor buys through affiliate link

1. Visitor taps affiliate link on Creator B's page
2. Lands on Creator A's product page with `?ref=B`
3. Server-side: validates ref handle, checks `affiliate_relationships` table for approved relationship + product grant
4. If valid: sets attribution cookie `subtree_ref=B` (7-day expiry)
5. At checkout: reads cookie, sets `Order.affiliate_user_id = B's user_id`, calculates `Order.affiliate_amount` from product's affiliate_rate
6. Cookie cleared on successful purchase

### Weekly commission payout (every Monday)

1. Cron job runs
2. Query: orders where `escrow_status = RELEASED AND affiliate_user_id IS NOT NULL AND affiliate_paid_at IS NULL AND released_at <= NOW() - 7 days` (dispute buffer)
3. Group by `affiliate_user_id`, sum `affiliate_amount`
4. For each affiliate with sum >= UGX 5,000 (minimum payout threshold):
   - Initiate Pesapal disbursement to affiliate's payout MoMo number
   - Mark `Order.affiliate_paid_at` on every order included in the batch
   - Create AffiliatePayoutRecord
   - Send SMS to affiliate: "You received UGX X in affiliate commissions for last week"
5. Affiliates under threshold: their commissions accumulate to the next week's batch

## What Changes

### New behavior
- Affiliate program toggle in merchant's shop settings
- Per-product affiliate rate and "open" toggle
- Bidirectional affiliate request flow (creator-initiated or merchant-initiated)
- Per-affiliate product grants (Invariant 5)
- Unique affiliate URLs with `?ref=` parameter
- 7-day cookie attribution
- Commission calculation at order creation (writes to `Order.affiliate_amount` — column added in Feature 39)
- Weekly batch payout cron job
- Affiliate dashboard (earnings, approved shops, my product links)
- Merchant dashboard (affiliate management, sales per affiliate)

### Modified behavior
- Order creation logic: reads ref cookie, validates affiliate relationship + product grant, sets affiliate_user_id and affiliate_amount
- Public product page: if URL has valid `?ref=` parameter AND the relationship is approved AND the product is in the affiliate's grants, sets attribution cookie
- Smart link cards (Feature 42): for `link_type = AFFILIATE`, renders rich data only if the link is on an approved affiliate's page (Invariant 2)

### Unchanged
- Non-affiliated orders flow exactly as before
- Shop, products, escrow, donation, fundraiser flows unchanged

## Data Model Changes

```prisma
model AffiliateRelationship {
  id                Int                     @id @default(autoincrement())
  shop_user_id      Int
  affiliate_user_id Int
  initiated_by      AffiliateInitiator
  status            AffiliateStatus         @default(PENDING)
  requested_at      DateTime                @default(now())
  reviewed_at       DateTime?
  rejected_reason   String?
  created_at        DateTime                @default(now())

  shop_user         User                    @relation("shop_affiliates", fields: [shop_user_id], references: [id])
  affiliate_user    User                    @relation("my_affiliates", fields: [affiliate_user_id], references: [id])
  product_grants    AffiliateProductGrant[]

  @@unique([shop_user_id, affiliate_user_id])
  @@index([shop_user_id])
  @@index([affiliate_user_id])
  @@index([status])
}

model AffiliateProductGrant {
  id              Int       @id @default(autoincrement())
  relationship_id Int
  product_id      Int
  granted_at      DateTime  @default(now())
  revoked_at      DateTime?

  relationship    AffiliateRelationship @relation(fields: [relationship_id], references: [id], onDelete: Cascade)
  product         Product               @relation(fields: [product_id], references: [id])

  @@unique([relationship_id, product_id])
  @@index([relationship_id])
  @@index([product_id])
}

model AffiliatePayoutRecord {
  id                Int          @id @default(autoincrement())
  affiliate_user_id Int
  period_start      DateTime
  period_end        DateTime
  total_amount      BigInt
  order_count       Int
  pesapal_txn_id    String?      @unique
  status            PayoutStatus @default(PENDING)
  created_at        DateTime     @default(now())
  paid_at           DateTime?
  failure_reason    String?

  affiliate         User         @relation(fields: [affiliate_user_id], references: [id])

  @@index([affiliate_user_id])
  @@index([status])
}

enum AffiliateInitiator { CREATOR_REQUEST MERCHANT_INVITE }
enum AffiliateStatus    { PENDING APPROVED REJECTED SUSPENDED }
enum PayoutStatus       { PENDING PROCESSING PAID FAILED }
```

Add to `Order` (extends Feature 39 schema):

```prisma
affiliate_paid_at   DateTime?   // set when weekly batch pays out this order's commission
```

Migration: `feature_40_affiliate_network`

## Attribution Model

When a visitor taps `sub-tree.com/[merchant]/shop/[product]?ref=[affiliate-handle]`:

1. Server-side: look up affiliate-handle → user_id in our DB
2. Verify `AffiliateRelationship` exists with `status = APPROVED` for (shop owner of product, affiliate)
3. Verify `AffiliateProductGrant` exists for (relationship, product) and `revoked_at IS NULL`
4. If valid: set cookie `subtree_ref=[affiliate_user_id]` with 7-day expiry, HttpOnly, SameSite=Lax
5. At checkout: read cookie, set `affiliate_user_id` on Order, calculate `affiliate_amount`
6. Cookie cleared on successful purchase

Why 7 days: gives the visitor time to think, return, complete the purchase. Standard affiliate window.

Last-touch attribution: if the visitor taps a different affiliate's link within 7 days, the cookie overwrites with the new ref.

Invalid refs (non-existent handle, no relationship, no grant): ignored silently. Order proceeds with no affiliate.

## API Surface

```
# Merchant — affiliate program management
GET    /api/affiliates/merchant/requests               — incoming affiliate requests
PATCH  /api/affiliates/merchant/requests/[id]          — approve / reject
POST   /api/affiliates/merchant/invite                 — invite a creator by handle
PATCH  /api/affiliates/merchant/grants/[id]            — add/revoke product grants
GET    /api/affiliates/merchant/stats                  — per-affiliate sales breakdown

# Creator — affiliate participation
GET    /api/affiliates/mine                            — list approved shops + products I can promote
POST   /api/affiliates/request                         — send application to a merchant
PATCH  /api/affiliates/invites/[id]                    — accept / decline merchant invite
GET    /api/affiliates/earnings                        — commission balance, payout history

# Public — affiliate program discovery
GET    /api/public/shop/[username]/affiliate-program   — is the shop accepting affiliates? (for CTA display)

# Cron (internal — secured via CRON_SECRET header)
POST   /api/cron/affiliate-payouts                     — weekly Monday job; batches eligible commissions;
                                                         triggers Pesapal disbursements; writes AffiliatePayoutRecords
```

## Scope

### In scope
- Bidirectional affiliate requests (creator-initiated and merchant-invited)
- Per-affiliate, per-product grants (Invariant 5)
- `?ref=` attribution with 7-day last-touch cookie
- Commission locked at order creation (Invariant 1)
- Weekly batch payout cron (Monday, min threshold UGX 5,000)
- Affiliate dashboard: earnings, approved shops, shareable links
- Merchant dashboard: affiliate list, per-affiliate sales stats, approve/revoke
- SMS notification to affiliate on payout
- `AffiliatePayoutRecord` as append-only audit trail

### Out of scope
- Multi-level affiliate (no affiliates-of-affiliates — see V2-OVERVIEW deferred list)
- Cross-platform affiliate (non-Sub-tree shops)
- Real-time commission tracking (batch only)
- Affiliate performance tiers or bonus rates
- First-touch or linear attribution (last-touch only)
- Automated fraud detection at launch (manual monitoring)

## New Invariants

This feature implements v2 Invariant 1 (commissions locked at order time — the `affiliate_amount` column written at payment confirmation is never changed), v2 Invariant 2 (rich smart card preview only on approved affiliate pages — enforced at page render, not client-side), and v2 Invariant 5 (merchant controls which products each affiliate can promote — grants checked at cookie-set time and at checkout).

Service-level rules:
- An affiliate cannot generate attribution for a product not in their grants
- A suspended `AffiliateRelationship` prevents new cookie attribution but does NOT retroactively affect already-locked orders
- `AffiliatePayoutRecord` rows are append-only — payment failures get a new FAILED record, not an update
- The weekly cron only pays out commissions from orders where `escrow_status = RELEASED` — disputed or held orders are never included

## Success Criteria

1. A Pro creator can apply to a Business shop's affiliate program and be approved from the merchant dashboard
2. A merchant can approve an affiliate and restrict them to 2 of 5 products
3. A visitor who clicks an affiliate link and purchases within 7 days attributes the commission to the correct affiliate
4. A different affiliate link clicked after the first overwrites the attribution cookie (last-touch)
5. An invalid or expired `?ref=` parameter produces no attribution — order proceeds normally
6. Weekly cron fires, calculates correct batch totals per affiliate, initiates Pesapal disbursement, and writes AffiliatePayoutRecords
7. Affiliates below the UGX 5,000 threshold accumulate to the next week
8. A Free creator cannot apply to affiliate programs (route returns 403)
9. `npm run build` passes with no type errors

## Migration Plan

All new tables. `Order.affiliate_paid_at` is a nullable column added to an existing table from Feature 39.

The attribution cookie and `?ref=` validation logic is pure server-side — no schema migration required for attribution to function.

The weekly cron job should be registered in `vercel.json` at the same time as the escrow-release cron (Feature 39) so both jobs are managed together.

## Open Questions

- **Fraud detection baseline**: an affiliate could buy through their own link using a friend's phone number. At v2 launch, monitor manually — flag orders where `affiliate_user_id` matches an account with the same household IP or device fingerprint. Automated detection deferred to post-launch.
- **Minimum payout threshold (UGX 5,000)**: right level? Too low and batch costs eat the commission; too high and small affiliates wait too long. Recommend making this configurable in admin settings rather than hardcoded.
- **Affiliate link on profile — link_type integration**: when a creator adds their affiliate URL as a link, should the system auto-detect the `?ref=` and set `link_type = AFFILIATE`? Recommend yes — parse on save and set type accordingly. Needs coordination with Feature 42.
- **Merchant suspends affiliate mid-week**: their in-flight `affiliate_amount` on unreleased orders is still owed (commission was locked at order creation). The suspension only prevents new attributions. Confirm this is the intended behavior before build.
