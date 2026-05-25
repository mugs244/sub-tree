# 40 — Affiliate Network

## Status

Shipped (v1 code live) — **Amended 2026-05-25**: role separation, auto-push on approval, dashboard split. Amendments must be built before v3 launch.

## Date

2026-05-21 | Amended 2026-05-25

## Context Links

- `docs/PROJECT-OVERVIEW.md` — tier model
- `docs/ARCHITECTURE.md` — append-only financial records
- `docs/v2/V2-ARCHITECTURE.md` — Invariants 1, 2, 5
- `docs/v2/features/39-shop.md` — must be built first
- `docs/v3/features/64-product-categories.md` — product category system

---

## Role Model (Amended 2026-05-25)

The original spec conflated merchant and promoter. They are distinct roles:

| Role | Who | What they do |
|---|---|---|
| **Merchant** | BUSINESS, CONTENT_HOUSE | Runs a shop, manages affiliate program, approves/rejects promoters |
| **Promoter** | PRO, BUSINESS, CONTENT_HOUSE | Promotes a merchant's products on their public profile, earns commissions |

**PRO** — promoter only. Cannot be a merchant (no shop). Applies to affiliate programs and earns commissions.

**BUSINESS** — merchant first (runs own shop and affiliate program) + can also act as promoter of other businesses' products (e.g. an advertising agency promoting a client's products).

**CONTENT_HOUSE** — same dual role as BUSINESS: merchant + promoter.

### Dashboard Split

**Merchant view** (`/dashboard/affiliates/program`) — BUSINESS + CONTENT_HOUSE only:
- Toggle affiliate program on/off for my shop
- Per-product: commission rate (0–50%) and "open to affiliates" toggle
- Affiliates list — three sub-tabs:
  - **Pending** — applied creators awaiting review (handle, applied date, products requested) → Approve / Reject
  - **Current** — active approved affiliates (handle, products granted, sales attributed, commissions owed, profile link)
  - **Old** — rejected, suspended, or ended relationships (handle, final status, rejection/suspension reason if any)
- "Invite an affiliate" button

**Promoter view** (`/dashboard/affiliates/commissions`) — PRO + BUSINESS + CONTENT_HOUSE:
- Approved shops list with products I can promote
- Per product: my affiliate URL (copy button), clicks, sales, earnings
- Earnings summary: pending this cycle, paid to date, next payout date
- Payout history

PRO users land on promoter view only (no merchant tab). BUSINESS and CONTENT_HOUSE see a tab switcher: "My Program" | "My Commissions".

---

## Auto-Push on Approval (Amended 2026-05-25)

**Required behavior:** When a merchant approves a promoter, the system automatically creates a `Link` row on the promoter's profile for each granted product. No manual step required from the promoter.

- `link_type = AFFILIATE`
- `label` defaults to `[Product name] — [Merchant handle]`
- `url` = `sub-tree.com/[merchant]/shop/[product]?ref=[promoter-handle]`
- Link appears in the promoter's Links dashboard and on their public profile
- Promoter receives in-app notification + SMS:
  > "[Merchant] approved you to promote [Product]. A link has been added to your profile."

The promoter can reorder or remove the link like any other link. If removed, it is not automatically re-created.

If the merchant later revokes a grant or suspends the affiliate, the link is **not** automatically deleted (it becomes a dead link rendering as plain text per Invariant 2). The promoter is notified to remove it manually.

### Implementation note

`POST /api/affiliates/inbound/[id]/approve` must:
1. Set `AffiliateRelationship.status = APPROVED`
2. For each granted product: `prisma.link.create({ user_id: promoter_id, link_type: "AFFILIATE", url: affiliate_url, label: product_name, ... })`
3. Store the created `link.id` in `AffiliateProductGrant.auto_link_id`
4. Create in-app notification
5. Send SMS via `lib/sms.ts`

---

## Why

Sub-tree creators have audiences. Some sell products (Business tier). Others have audiences but no products of their own. The affiliate network connects them: a Pro creator with 10K followers can earn commission by promoting a Business creator's products.

Closed network — only Sub-tree creators can affiliate with Sub-tree shops. Keeps quality high and fraud manageable at launch.

---

## User Flow

### Merchant opens affiliate program

1. BUSINESS/CONTENT_HOUSE → Dashboard → Affiliates → My Program
2. Toggles "Accept affiliate applications" ON
3. Per product: sets commission rate and toggles "Open to affiliates"
4. Sees inbound requests panel

### PRO creator applies to promote

1. PRO visits a BUSINESS creator's profile or shop page
2. Sees "Promote this shop" button (visible only to signed-in PRO/BUSINESS/CH users)
3. Submits application
4. Merchant notified (in-app + SMS)
5. Merchant approves with product selection
6. **Affiliate links automatically appear on the PRO creator's public profile**

### Merchant invites a promoter

1. Merchant → Dashboard → Affiliates → My Program → Invite Affiliate
2. Searches by handle, selects creator
3. Selects products to grant, sends invitation
4. Promoter notified, accepts or declines
5. **On acceptance: affiliate links auto-pushed to promoter's profile**

### Visitor buys through affiliate link

1. Visitor taps affiliate link on promoter's public profile
2. Lands on product page with `?ref=[promoter-handle]`
3. Server validates: relationship APPROVED + product grant active + not revoked
4. If valid: sets attribution cookie (7-day, HttpOnly, last-touch)
5. At checkout: `Order.affiliate_user_id` and `Order.affiliate_amount` locked (Invariant 1)
6. Cookie cleared on successful purchase

### Weekly commission payout (every Monday)

1. Cron job runs
2. Query: released orders with unpaid affiliate commissions, outside 7-day dispute buffer
3. Group by `affiliate_user_id`, sum commissions
4. For each promoter above `getSetting("affiliate_min_payout_ugx", 5000)`:
   - Pesapal disbursement to promoter's MoMo
   - Mark orders as paid, create `AffiliatePayoutRecord`
   - SMS: "You received UGX X in affiliate commissions."
5. Under-threshold balances carry forward

---

## Data Model

```prisma
model AffiliateRelationship {
  id                Int                     @id @default(autoincrement())
  shop_user_id      Int                     // must be BUSINESS or CONTENT_HOUSE
  affiliate_user_id Int                     // PRO, BUSINESS, or CONTENT_HOUSE
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
  @@index([shop_user_id, status])
  @@index([affiliate_user_id, status])
}

model AffiliateProductGrant {
  id              Int       @id @default(autoincrement())
  relationship_id Int
  product_id      Int
  granted_at      DateTime  @default(now())
  revoked_at      DateTime?
  auto_link_id    Int?      // Link row auto-created on promoter's profile; null if promoter deleted it

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

---

## API Surface

```
# Merchant side
GET    /api/affiliates/inbound                     — pending requests for my shop
POST   /api/affiliates/inbound/[id]/approve        — approve, grant products, auto-push links
POST   /api/affiliates/inbound/[id]/reject         — reject with reason
POST   /api/affiliates/invite                      — invite a creator by handle
PATCH  /api/affiliates/[id]/grants                 — update product grants
POST   /api/affiliates/[id]/suspend                — suspend active affiliate

# Promoter side
POST   /api/affiliates/apply/[merchant-handle]     — apply to promote
GET    /api/affiliates/my-shops                    — approved shops, grants, earnings
GET    /api/affiliates/earnings                    — pending, paid, total
GET    /api/affiliates/payouts                     — payout history

# Cron
POST   /api/cron/affiliate-payouts                 — weekly batch (CRON_SECRET protected)
```

---

## Invariants

- PRO creators cannot be merchants — `shop_user_id` must be BUSINESS or CONTENT_HOUSE; enforced at the API
- A creator cannot affiliate with their own shop (self-referral blocked)
- Commission rates lock at order creation; changes to `Product.affiliate_rate` never affect past orders
- `AffiliatePayoutRecord` is append-only
- Auto-pushed links are standard Link rows — promoter can delete them; no automatic recreation
- Rich affiliate card rendering checks the approved relationship server-side on every render — never cached
- Revoked or suspended affiliates' links render as plain text (Invariant 2) — not automatically deleted

---

## Success Criteria

1. BUSINESS merchant approves a PRO promoter → PRO's profile immediately shows the product link, PRO receives notification
2. PRO dashboard shows commissions by product and merchant, payout history
3. BUSINESS dashboard has "My Program" + "My Commissions" tabs — both functional
4. Attribution cookie is set correctly on `?ref=` visits; checkout locks `affiliate_amount`
5. Weekly cron aggregates released orders, meets threshold, disburses via Pesapal
6. Suspended affiliate's product links render as plain text on their profile
7. PRO creator gets 403 on all merchant-side affiliate management routes
8. Invited promoter receives notification; on acceptance, link auto-appears on their profile
