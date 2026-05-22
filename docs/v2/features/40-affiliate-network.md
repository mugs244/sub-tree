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
# Merchant side
POST   /api/affiliates/program/toggle              — enable/disable program for my shop
PATCH  /api/shop/products/[id]/affiliate           — set per-product rate and open status
GET    /api/affiliates/inbound                     — list inbound requests
POST   /api/affiliates/inbound/[id]/approve        — approve, select products to grant
POST   /api/affiliates/inbound/[id]/reject         — reject with reason
POST   /api/affiliates/invite                      — invite a specific creator
PATCH  /api/affiliates/[id]/grants                 — update which products an affiliate can promote
POST   /api/affiliates/[id]/suspend                — suspend an active affiliate

# Affiliate (promoter) side
POST   /api/affiliates/apply/[merchant-handle]     — apply to be an affiliate
GET    /api/affiliates/my-shops                    — list approved shops + product grants
GET    /api/affiliates/earnings                    — summary: pending, paid, total
GET    /api/affiliates/payouts                     — history of weekly payouts

# Public side (with affiliate context)
GET    /api/public/products/[id]?ref=[handle]      — product detail with attribution

# Cron (internal — secured via CRON_SECRET header)
POST   /api/cron/affiliate-payouts                 — weekly batch (Monday)
```

## UI Changes

### Merchant — Shop → Affiliate Program tab
- Toggle "Accept affiliate applications"
- Per-product: rate (slider 0–50%) + "Open to affiliates" toggle
- Pending requests list with affiliate's handle, follower count if available, profile preview
- Approve: opens modal to select products from open list
- Active affiliates list: handle, products granted, sales attributed, commission earned, "Suspend" button

### Affiliate — My Affiliates tab
- Approved shops list (cards): merchant handle, product count granted
- Per shop: list of products with affiliate URL (copy button), commission rate, sales, earnings
- Earnings summary card: pending payout (this week), paid to date, next payout date

### Public product page with ref param
- Looks identical to non-affiliate access — visitor doesn't see the affiliate's involvement
- Server logs the attribution silently
- Cookie set silently

### Profile page with affiliate links (consumes Feature 42 smart link rendering)
- Affiliate's link to a product renders as a rich card (price, image, "Buy now")
- Per Invariant 2: this rich card renders ONLY because the affiliate is approved
- If someone else copies the same affiliate URL onto their non-affiliate page, the link renders as a plain link (no rich card)

## Scope

### In scope
- Affiliate program enable/disable per shop
- Per-product rate + open toggle
- Bidirectional request flow (creator-applies / merchant-invites)
- Per-affiliate per-product grants
- Approval/rejection with reason
- Suspension of active affiliates
- `?ref=` URL parameter parsing + cookie attribution
- 7-day attribution window with last-touch
- Commission calculation at order time (lock per Invariant 1)
- Weekly batch payout cron
- Minimum payout threshold (UGX 5,000)
- Affiliate earnings dashboard
- Merchant affiliate management dashboard
- SMS notification on payout success

### Out of scope
- Multi-level affiliate (affiliates of affiliates) — fraud risk
- Cross-platform affiliate (non-Sub-tree shops) — out of v2
- Per-affiliate custom commission rate (rate is per-product, same for all affiliates of that product)
- Performance analytics beyond clicks + sales counts
- Automated dispute resolution for commission disputes
- Affiliate program API for external platforms
- Affiliate marketplace / discovery surface (in v2, affiliates have to seek out shops)

## New Invariants

Honors v2 Invariants 1, 2, 5.

Service-level rules:
- Affiliate commission rates are locked at order creation. Subsequent changes to `Product.affiliate_rate` do not affect existing orders.
- An affiliate can only see/promote products in their `AffiliateProductGrant` list with `revoked_at IS NULL`.
- The order creation endpoint validates the affiliate relationship + product grant before setting `affiliate_user_id`.
- Weekly payout only includes orders where escrow has been RELEASED AND `released_at <= NOW() - 7 days` (dispute buffer).
- `AffiliatePayoutRecord` is append-only.
- A creator cannot affiliate with their own shop (self-referral blocked at relationship creation).
- Affiliates under the payout threshold (UGX 5,000) carry their balance forward; their commissions are never lost.

## Success Criteria

1. A merchant can enable affiliate program, set per-product rates, and another creator can apply and be approved with specific product grants
2. An approved affiliate sees only the products they've been granted in their dashboard
3. A buyer purchasing through `?ref=` attribution correctly creates an Order with the affiliate's user_id and the locked commission amount
4. Weekly cron job correctly aggregates released orders, applies minimum threshold, and disburses to affiliates via Pesapal
5. A revoked affiliate's existing links stop rendering rich cards on their profile (Invariant 2)
6. Last-touch attribution works: tapping a different affiliate's link within 7 days overwrites the cookie

## Open Questions

- **Platform fee split when affiliate is involved**: confirm that platform fee stays the same (8%), and the affiliate commission comes out of the seller's share, not added on top of the buyer's price.
- **Minimum payout threshold UGX 5,000**: confirm appropriate for the market.
- **Failed payout retry policy**: recommend retry next Monday's batch up to 3 times before marking PAYOUT_FAILED and alerting admin.
- **Affiliate fraud detection**: an affiliate could buy through their own link with a different phone. Recommend basic detection — same buyer_phone purchasing through their own affiliate link more than once flags for manual review.

## Migration Plan

Net new feature. Depends on Feature 39 being fully shipped and tested first. Do not start until shop orders are flowing in sandbox.
