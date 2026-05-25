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
POST   /api/shop/products              — create product (Business+)
GET    /api/shop/products              — list my products
PATCH  /api/shop/products/[id]         — update product
DELETE /api/shop/products/[id]         — deactivate (soft — status = INACTIVE)
POST   /api/shop/products/[id]/upload  — get Vercel Blob signed upload URL (digital only)
GET    /api/public/[username]/shop     — public shop products list
GET    /api/public/products/[id]       — product detail (public)
POST   /api/orders/initiate            — start checkout (creates PENDING order, initiates Pesapal)
GET    /api/orders/[id]/status         — poll order status
GET    /api/orders/[id]/download       — get signed download URL (digital only — validates token)
POST   /api/orders/[id]/dispute        — buyer raises dispute
GET    /api/shop/orders                — creator's order list
GET    /api/shop/escrow                — creator's escrow summary (held funds, release timeline)
POST   /api/webhooks/payments/pesapal/shop   — shop-specific Pesapal webhook (or unified handler discriminates)
GET    /api/admin/disputes             — admin dispute queue
POST   /api/admin/disputes/[id]/resolve — admin resolves dispute (release to seller OR refund to buyer)
GET    /api/cron/escrow-release        — Vercel Cron daily auto-release pass (protected by CRON_SECRET)
```

## Escrow Auto-Release Job

Daily Vercel Cron job:

1. Query: orders where `escrow_status = HELD AND escrow_release_at <= NOW() AND dispute_raised_at IS NULL`
2. For each: initiate Pesapal disbursement to seller's MoMo, mark `escrow_status = RELEASED`, append `OrderEvent(ESCROW_RELEASED)`
3. If disbursement fails: do NOT change status; log error; retry next day
4. Affiliate commission flagging happens here too (see Feature 40)

This job is the trigger condition for installing Trigger.dev from `pending-dependencies.md`. At launch volume, Vercel Cron is sufficient. When daily order count exceeds ~500 or reliability matters more, migrate.

## Digital Delivery

On successful payment webhook (digital products only):

1. Generate cryptographically random 32-byte download token (URL-safe base64)
2. Hash the token, store hash in `Order.download_token`
3. Set `download_expires_at = NOW() + 48 hours`
4. Return success page with download URL: `/api/orders/[id]/download?token=[raw_token]`
5. Optionally SMS the link via Africa's Talking

Download endpoint:
- Validates token hash matches stored hash
- Checks not expired
- Checks `download_count < 3`
- Generates short-lived Vercel Blob signed URL (60 second TTL)
- Increments `download_count`
- Appends `OrderEvent(DOWNLOAD_ACCESSED)` with masked IP
- Redirects to the signed Blob URL

## UI Changes

### Dashboard — Shop tab (Business+)
- Product list with stock, sales, revenue
- "Add Product" button → modal/page for creation
- Per-product: edit, deactivate, view orders, affiliate program toggle
- Bulk actions deferred to post-launch

### Dashboard — Orders tab (Business+)
- Filterable order list (status, date range, product)
- Per-order detail: buyer info, payment status, escrow status, dispute status, release timeline
- "Manually release" button (Business owner can release early if happy with delivery)

### Dashboard — Escrow Summary widget
- Held funds total (sum of orders in HELD state)
- Next release date
- Disputed orders count (red badge if > 0)

### Public profile page — Shop section
- Below link stack
- Product cards (grid on desktop, list on mobile)
- "View shop" link → `/[username]/shop` (full product grid)
- Single product → `/[username]/shop/[product]`

### Product detail page
- Cover image, name, price, description
- "Buy" CTA → checkout flow
- "Limited stock — X remaining" badge if physical and stock < 10
- For digital: "Instant download after purchase"

### Checkout / Order confirmation
- Buyer fills in name, phone, optional email
- Pesapal STK push pending state
- Success page:
  - Digital: prominent "Download now" CTA, link valid for 48 hours, max 3 downloads, optional "Send to my email/SMS"
  - Physical: creator's shipping instructions, expected delivery window, "Order #" for buyer's reference

## Scope

### In scope
- Product creation (digital + physical)
- Vercel Blob digital file storage
- Shop section on profile and standalone shop page
- Product detail page
- Pesapal checkout with escrow
- Digital delivery (signed URLs, 48h expiry, 3 download limit)
- Physical delivery instructions display
- Order management dashboard
- Escrow dashboard
- Buyer-raised disputes
- Manual admin dispute resolution
- Auto-release cron job
- Affiliate commission calculation at order time (consumed by Feature 40)
- Affiliate program toggle per product
- Manual early release by seller

### Out of scope
- Sub-tree handling physical fulfillment in any way
- Refund flow beyond admin dispute resolution
- Discount codes, promotional pricing
- Product categories, search, filtering (moved to Feature 64)
- Reviews or ratings
- Recurring subscriptions for digital content
- VAT/tax calculation (deferred to v1 Feature 30 — EFRIS)
- Card payments (MoMo-first; Pesapal supports cards but we don't surface this at v2)
- Buyer accounts (every purchase is one-shot, no buyer login)
- Inventory beyond simple stock decrement

## New Invariants

Honors v2 Invariant 1 (affiliate amounts locked at order time — `affiliate_amount` set on Order creation, never updated).

Service-level rules:
- Order records are append-only. Status changes happen via OrderEvent rows.
- Escrow funds are never released without either: (a) auto-release timer expiry with no dispute, or (b) explicit admin action resolving a dispute, or (c) explicit early release by seller.
- Download tokens are single-use per request: regenerated on each successful download access, expired by time OR count whichever first.
- `affiliate_rate` on Product is locked at the time an Order is created (in `Order.affiliate_amount`) — changing the rate later does not affect in-flight or completed orders.
- Refunds reverse escrow back to buyer's MoMo via Pesapal; the Order moves to REFUNDED but is not deleted.

## Success Criteria

1. A Business creator can list a digital product, a buyer completes Pesapal checkout, and the buyer can download the file within 60 seconds of PIN approval
2. A Business creator can list a physical product, a buyer completes checkout, and the buyer sees the creator's shipping instructions on the confirmation page
3. Auto-release cron job correctly releases funds after the configured timer expires with no dispute
4. A buyer can raise a dispute within the timer window and the admin sees it in the review queue
5. Download links expire after 48 hours OR 3 downloads, whichever comes first
6. A free or Pro (non-Business) creator cannot create products — sees upgrade prompt
7. Pesapal escrow flow tested end-to-end in sandbox with at least 10 transactions including dispute scenarios

## Open Questions

- **Sub-tree's platform fee on shop sales**: recommend 8% on Business tier sales (vs 3% on donations). Confirm before building checkout math.
- **Max digital file size**: 500MB suggested. Confirm Vercel Blob pricing supports this at MVP volume.
- **Max download count per purchase**: 3 suggested. Confirm.
- **Auto-release timer options**: 3 / 7 / 14 days. Confirm appropriate for EA physical delivery norms.
- **Dispute window**: buyer can raise dispute any time before `escrow_release_at`. Should there be a minimum window even if seller sets 3 days? Recommend 3-day minimum dispute window enforced server-side.

## Migration Plan

Net new feature. No existing data affected.

---

## Amendments (2026-05-25)

### 1. File Upload — Device, Not URL

**Current (wrong):** `cover_image_url` and `file_url` are text fields where creators paste an external URL.

**Required:** Creators upload directly from their phone or desktop. Both cover images (for all products) and digital files must use Vercel Blob direct-upload. Physical products should allow uploading multiple photos and/or a short video.

**Implementation:**
- `POST /api/shop/products/[id]/upload?type=cover` — returns a Vercel Blob upload URL for the cover image
- `POST /api/shop/products/[id]/upload?type=file` — returns a Vercel Blob upload URL for the digital file
- `POST /api/shop/products/[id]/upload?type=photo&index=[0-4]` — returns upload URL for a physical product photo (up to 5 photos)
- Client uses the signed upload URL to PUT the file directly to Vercel Blob
- After upload, client confirms the URL back to the server via PATCH product

Add to `Product`:
```prisma
cover_image_url   String?          // Vercel Blob URL (uploaded, not external)
file_url          String?          // Vercel Blob URL — digital products only
product_photos    ProductPhoto[]   // physical products: up to 5 photos or 1 video
```

```prisma
model ProductPhoto {
  id         Int      @id @default(autoincrement())
  product_id Int
  url        String   // Vercel Blob URL
  media_type String   // "image" | "video"
  position   Int      @default(0)
  created_at DateTime @default(now())

  product    Product  @relation(fields: [product_id], references: [id], onDelete: Cascade)

  @@index([product_id])
}
```

Same device-upload pattern applies to profile pictures and wallpapers — see Feature 65.

### 2. Enhanced Shop Dashboard (Business + Content House)

The shop dashboard must show, in addition to the product list:

**Shop Overview tab:**
- Total items sold (all time)
- Revenue this month (sum of seller_amount on RELEASED orders)
- Pending orders count (payment confirmed, escrow HELD)
- Completed orders count (escrow RELEASED)
- Most sold products (top 5 by order count)
- Generate shop link button — copies `sub-tree.com/[username]/shop` to clipboard

**Orders tab:**
- Tabs: All | Pending | Completed | Disputed
- Per order row: product name, buyer name, amount, status, date, action (release early / view dispute)
- Filter by date range and product

**Product Categories:**
Products are tagged with a category when created. See Feature 64 for the full category system. The shop dashboard shows a category filter so the merchant can view all Shirts, all Movies, etc.

### 4. Gated Shopping — Fan Account Required to Purchase (2026-05-25)

**Rationale:** Requiring a Fan account before checkout builds a captive, retargetable user base. Every buyer becomes an identifiable fan with a profile, enabling future notifications, re-engagement, and analytics on who is buying from which creators.

**Behaviour:**
- Any visitor who taps "Buy" on a product is checked for a signed-in Fan session
- If not signed in: redirect to `/sign-up?next=/[username]/shop/[product]&reason=purchase` — Fan sign-up page with copy: "Create a free account to complete your purchase"
- After sign-up/sign-in: redirect back to the product page with the checkout pre-opened
- The `next` param is preserved through the Clerk auth flow via `afterSignInUrl` / `afterSignUpUrl`
- Anonymous browsing of the shop is still allowed — anyone can view products, prices, photos without logging in
- Only the checkout step requires a Fan account

**Why not block browsing too?** Browsing must remain public so affiliate links and shared product URLs work without friction. The gate is specifically at the "Buy" action.

**Implementation note:** The buy button on the product detail page checks `useUser()` (Clerk). If no session, it redirects rather than opening the checkout modal. The server-side order initiation endpoint also enforces this: `POST /api/orders/initiate` now requires a valid Clerk session.

### 3. API additions

```
GET    /api/shop/stats                       — totals: sold, revenue, pending, completed
GET    /api/shop/products/[id]/upload        — get signed Vercel Blob upload URL
POST   /api/shop/products/[id]/photos        — add a photo/video to a physical product
DELETE /api/shop/products/[id]/photos/[pid]  — remove a photo
```
