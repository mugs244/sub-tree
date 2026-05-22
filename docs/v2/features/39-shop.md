# 39 — Shop (Digital & Physical Products)

## Status

Proposed — BLOCKED until Pesapal merchant onboarding confirms escrow + split coverage under their BoU license. See `docs/v2/V2-ARCHITECTURE.md` Open Architectural Questions.

## Date

2026-05-21

## Context Links

- `docs/PROJECT-OVERVIEW.md` — Business tier scope
- `docs/ARCHITECTURE.md` — Invariant 8 (no fund pooling — Pesapal handles escrow)
- `docs/v2/V2-ARCHITECTURE.md` — Pro tier billing extension to Business tier, escrow flow
- `docs/features/36-payment-aggregators.md` — Pesapal + OpenFloat (Greenlit)
- `docs/pending-dependencies.md` — Vercel Blob entry for digital product storage

Read those first. This file documents what is new.

## Why

Creators currently have one revenue stream on Sub-tree: donations/tips. A shop gives them a second stream — selling things they've made. Musicians sell beats, PDFs, sample packs. Designers sell presets and templates. Creators sell merch.

This transforms Sub-tree from a "support me" page into a "buy from me" page for Business tier creators. It's the largest single feature in v2 and the primary justification for the Business tier price point.

Physical fulfillment is handled entirely by the creator — Sub-tree processes payment, holds funds in Pesapal's escrow, releases after the auto-release timer if no dispute. We never touch shipping, inventory beyond stock tracking, or post-purchase customer service.

## ⚠️ Regulatory Gate

Sub-tree CANNOT hold buyer funds in its own account. This feature is built on the assumption that **Pesapal's BoU license covers escrow-with-auto-release semantics**.

Before this feature starts:

1. Confirm with Pesapal compliance: funds can be held in their escrow on Sub-tree's behalf, released to creators via API after a timer expires
2. Confirm with Pesapal: refund flows are supported (for disputed orders that don't release)
3. If Pesapal cannot offer escrow coverage, this feature pauses until either: (a) Sub-tree obtains its own BoU payment aggregator license, or (b) Shop is restructured to direct-settlement-only (no escrow, buyer takes the risk)

Build sandbox-side freely. Do NOT enable real money flow through Shop until legal review is complete.

## User Flow

### Creator sets up shop

1. Business creator goes to Dashboard → Shop → Add Product
2. Fills in: product name, description, price (UGX), product type (digital / physical), cover image
3. For digital: uploads file (PDF, MP3, ZIP, etc.) to Vercel Blob (max 500MB)
4. For physical: enters shipping info instructions (shown to buyer post-purchase — creator handles delivery themselves)
5. Sets stock (unlimited or limited quantity) for physical products
6. Sets auto-release timer: 3 days / 7 days / 14 days
7. Sets affiliate commission rate per product (0–50%) — used by Feature 40
8. Product appears as a card in the Shop section on their public profile page

### Visitor buys a product

1. Visitor sees Shop section on creator's profile
2. Taps a product card → product detail page (image, description, price, "Buy" button)
3. Enters name, MoMo number, optional email (for digital delivery)
4. Pesapal STK push, PIN approval
5. **For digital:** receives time-limited signed download URL (valid 48 hours, max 3 downloads) via success page and optionally SMS
6. **For physical:** sees order confirmation with creator's shipping instructions and expected timeline
7. Funds held in Pesapal escrow

### Funds release

- Auto-releases to creator after the configured timer (3/7/14 days) if no dispute raised
- Buyer can raise a dispute within the timer window
- Admin reviews disputes manually at v2 launch (no automated resolution)
- On release: creator receives (sale price − platform fee − affiliate commission if applicable); affiliate receives commission via Feature 40's weekly batch

## What Changes

### New behavior
- Shop section on public profile page (Business tier only — feature flag on `user.tier`)
- Product cards with image, name, price
- Product detail page at `/[username]/shop/[product]`
- Checkout flow (Pesapal + escrow)
- Digital delivery via Vercel Blob signed URLs
- Physical delivery instructions shown post-purchase
- Escrow dashboard for creator (held funds, release timeline)
- Order management dashboard
- Dispute raising by buyer
- Auto-release cron job (Vercel Cron daily; migrate to Trigger.dev when volume justifies)
- Admin dispute review queue

### Modified behavior
- Public profile page: Business creators get a Shop section below their links when they have active products
- Pesapal webhook handler: adds escrow hold logic (funds flagged as held until release timer expires or dispute resolves)

### Unchanged
- Regular donation button unaffected
- Fundraiser unaffected (separate flow)
- Link manager unaffected
- Free/Pro creators see no Shop section in their dashboard

## Data Model Changes

```prisma
model Product {
  id                  Int             @id @default(autoincrement())
  user_id             Int
  name                String
  description         String          @db.Text
  price               BigInt          // UGX
  product_type        ProductType
  cover_image_url     String?
  file_url            String?         // Vercel Blob URL for digital
  file_size_bytes     BigInt?
  shipping_info       String?         // shown to buyer for physical
  stock               Int?            // null = unlimited
  auto_release_days   Int             @default(7)
  affiliate_rate      Decimal         @default(0) @db.Decimal(5, 4) // 0.0000–0.5000
  affiliate_open      Boolean         @default(false)
  status              ProductStatus   @default(ACTIVE)
  created_at          DateTime        @default(now())
  updated_at          DateTime        @updatedAt

  user                User            @relation(fields: [user_id], references: [id])
  orders              Order[]

  @@index([user_id])
  @@index([status])
}

model Order {
  id                  Int             @id @default(autoincrement())
  product_id          Int
  seller_user_id      Int
  affiliate_user_id   Int?
  buyer_phone         String
  buyer_name          String
  buyer_email         String?
  amount_paid         BigInt
  platform_fee        BigInt
  seller_amount       BigInt          // amount_paid - platform_fee - affiliate_amount
  affiliate_amount    BigInt?         // locked at order time (v2 Invariant 1)
  pesapal_txn_id      String          @unique
  pesapal_provider    String          // "MTN" | "AIRTEL" | "MPESA" | "CARD"
  escrow_status       EscrowStatus    @default(HELD)
  escrow_release_at   DateTime        // NOW() + auto_release_days, set on payment confirm
  dispute_raised_at   DateTime?
  released_at         DateTime?
  download_token      String?         @unique
  download_expires_at DateTime?
  download_count      Int             @default(0)
  created_at          DateTime        @default(now())
  updated_at          DateTime        @updatedAt

  product             Product         @relation(fields: [product_id], references: [id])
  seller              User            @relation("seller_orders", fields: [seller_user_id], references: [id])
  affiliate           User?           @relation("affiliate_orders", fields: [affiliate_user_id], references: [id])
  events              OrderEvent[]

  @@index([seller_user_id])
  @@index([affiliate_user_id])
  @@index([escrow_status])
  @@index([escrow_release_at])
}

model OrderEvent {
  id          Int       @id @default(autoincrement())
  order_id    Int
  event_type  String    // PAYMENT_CONFIRMED | ESCROW_RELEASED | DISPUTE_RAISED | DISPUTE_RESOLVED | DOWNLOAD_ACCESSED | REFUNDED
  actor_id    Int?      // null for system events
  metadata    Json?
  created_at  DateTime  @default(now())

  order       Order     @relation(fields: [order_id], references: [id])

  @@index([order_id])
}

enum ProductType   { DIGITAL PHYSICAL }
enum ProductStatus { ACTIVE INACTIVE SOLD_OUT }
enum EscrowStatus  { HELD RELEASED DISPUTED REFUNDED }
```

Migration: `feature_39_shop`

## API Surface

```
# Products
POST   /api/shop/products                        — create product (Business+ only)
GET    /api/shop/products                        — list caller's products
PATCH  /api/shop/products/[id]                   — update product
DELETE /api/shop/products/[id]                   — soft-delete (status = INACTIVE)

# Public
GET    /api/public/shop/[username]               — list active products for a profile page
GET    /api/public/shop/[username]/[product_id]  — product detail

# Checkout
POST   /api/shop/checkout                        — initiate Pesapal payment, create Order in HELD state
GET    /api/shop/orders/[id]                     — order status (buyer-facing, keyed on pesapal_txn_id)
POST   /api/shop/orders/[id]/dispute             — buyer raises a dispute

# Seller order management
GET    /api/shop/seller/orders                   — list seller's orders with escrow state
GET    /api/shop/seller/orders/[id]              — order detail

# Downloads (digital)
GET    /api/shop/download/[token]                — serve signed Vercel Blob URL; validates token, expiry, count

# Cron (internal — secured via CRON_SECRET header)
POST   /api/cron/escrow-release                  — daily job; finds orders where escrow_release_at <= NOW()
                                                   and escrow_status = HELD; triggers Pesapal release API;
                                                   writes OrderEvent(ESCROW_RELEASED); notifies seller

# Admin
GET    /api/admin/disputes                       — list disputed orders
PATCH  /api/admin/disputes/[id]                  — resolve: release to seller or refund to buyer
```

The Pesapal webhook handler (`POST /api/webhooks/payments`) is extended to handle Shop payment confirmations: create the Order record, set `escrow_status = HELD`, set `escrow_release_at`, generate `download_token` for digital, write `OrderEvent(PAYMENT_CONFIRMED)`.

## Scope

### In scope
- Digital and physical product types
- Vercel Blob upload for digital files (max 500MB)
- Pesapal STK push checkout
- Escrow hold + auto-release timer (3/7/14 days)
- Signed time-limited download URLs (48h, max 3 downloads)
- Dispute raising by buyer (manual admin resolution)
- Seller escrow dashboard (held amount, release timeline)
- Order management (list, detail, status)
- Physical shipping instructions post-purchase
- Stock tracking for physical products
- Affiliate commission rate per product (consumed by Feature 40)
- Cron job for daily escrow release

### Out of scope
- Automated dispute resolution (manual admin at v2 launch)
- Subscription products or recurring payments
- Product variants (sizes, colors) — flat product only
- Bundle pricing
- Discount codes
- Reviews and ratings
- Buyer account or purchase history (guest checkout only at v2)
- Physical shipping integration (creator handles fulfillment)
- Invoice generation (creator's responsibility)
- VAT/tax calculation

## New Invariants

This feature operates under v2 Invariant 1 (affiliate commissions locked at order time). Invariant 1 is implemented here: `affiliate_amount` is calculated and written to the `Order` row at payment confirmation time and never updated after.

Service-level rules:
- `seller_amount + affiliate_amount + platform_fee = amount_paid` must hold for every released order
- `download_count` increments atomically; at 3 the token is invalidated regardless of expiry
- A DISPUTED order cannot auto-release — cron job skips orders with `dispute_raised_at IS NOT NULL`
- `OrderEvent` rows are append-only — never updated or deleted
- Stock is decremented atomically at payment confirmation, not at checkout initiation

## Success Criteria

1. A Business creator can list a digital product and a buyer can purchase and download it via MoMo in a single session
2. A physical product order shows the creator's shipping instructions on the confirmation page
3. Funds auto-release to the creator after the configured timer with no manual intervention required
4. A buyer can raise a dispute before the escrow timer expires
5. A download token expires after 48 hours and is invalidated after 3 downloads
6. The escrow-release cron job runs daily and processes all eligible orders
7. A Free or Pro creator cannot create a shop product (route returns 403)
8. `seller_amount + affiliate_amount + platform_fee = amount_paid` holds for every completed order
9. `npm run build` passes with no type errors

## Migration Plan

All new tables. Zero impact on existing data.

The `escrow-release` cron job should be registered in `vercel.json` from day one, even before Shop is live, so the infrastructure is validated. Configure it to no-op when there are no eligible orders.

Vercel Blob must be provisioned before digital products can be enabled — see `docs/pending-dependencies.md`.

## Open Questions

- **Pesapal release API**: does Pesapal expose an explicit "release escrow" API call, or does auto-release happen on their side by timer? If the latter, Sub-tree's cron just marks the order as released in our DB after the timer — the actual money movement is fully on Pesapal. Clarify during merchant onboarding.
- **Download delivery via SMS**: adding a download link to the Pesapal payment success notification or via Africa's Talking (Feature 17) is cleaner than relying on a success page the buyer might close. Defer to Feature 17 integration pass.
- **Stock race condition**: two buyers could initiate checkout simultaneously for the last physical unit. At MVP, decrement stock at payment confirmation (not at checkout start) and let the second buyer's payment confirm to an out-of-stock state — show an apology page. A proper reservation system (hold stock for 10 minutes at checkout start) is a v2 polish item.
- **500MB upload limit on Vercel Blob**: Vercel's free tier has a 500MB total storage limit. Vercel Pro unlocks larger storage. Confirm Vercel tier before enabling file upload.
