# Sub-tree v2 — Architecture Additions

This file describes what changes in the architecture for v2. The v1 `docs/ARCHITECTURE.md` continues to apply; this file documents additions and the specific places v1 invariants evolve.

## Stack Additions

| Layer | Technology | Role | When introduced |
|---|---|---|---|
| File storage (digital products) | Vercel Blob (signed URLs) | Digital product delivery via time-limited tokens | Feature 39 (Shop) |
| Background jobs | Vercel Cron at MVP, Trigger.dev at scale | Escrow auto-release, weekly affiliate payouts | Feature 39, Feature 40 |
| Open Graph fetching | `open-graph-scraper` (server-side) | Smart link metadata extraction | Feature 42 |
| Realtime sync (Content Houses only) | Liveblocks | Multi-user editing, presence, activity feed | Feature 41 |
| Permissions layer (Content Houses only) | Custom service on top of Clerk | Role-based access within a team | Feature 41 |
| OG metadata cache | Postgres column on `Link` (`smart_card_meta JSON`) | Avoids re-fetching on every page render | Feature 42 |

The Realtime and Permissions rows are introduced only when Feature 41 (Content Houses) begins. Earlier v2 features (37-40, 42) do not require these.

## Invariant Changes from v1

### v1 Invariant 5 (single owner) — REPLACED for v2

**Original (v1):** "Every resource has a single owner."

**v2 replacement:**

> Every resource belongs to EITHER a single user OR a team (Content House). If team-owned, role-based permissions govern who can mutate it. Audit logs (`actor_user_id`) capture every mutation regardless of ownership model. Team membership is tracked in `team_memberships` with explicit roles.

Solo accounts remain the default. Content House mode is opt-in via the dedicated tier. All v1 features and all v2 non-Content-House features (37, 38, 39, 40, 42) continue to operate under single-owner semantics. The team-owned path is exercised only by Content House accounts.

### v1 Invariant 8 (direct settlement) — SCOPED for v2

**Original (v1):** "Direct settlement of donations means we do not pool customer funds."

**v2 scoping:**

> Donations continue to settle directly to creators (Pesapal routes from donor wallet to creator wallet with platform fee split off). v2 features that necessarily hold funds — Shop escrow, Affiliate batch payouts, Charity fundraiser splits — are explicitly identified as escrow flows and are settled through Pesapal's licensed payment infrastructure. Sub-tree's corporate account does not pool funds at any point. Pesapal's BoU license covers the escrow/split semantics. If Pesapal cannot confirm coverage during merchant onboarding, v2 Shop scope is restructured before build begins.

This is not a violation of the v1 invariant — it's a scoped extension with named features and a regulatory gate.

## New v2 Invariants

**v2 Invariant 1: Affiliate commissions are locked at order time.**

When an order is created with an `affiliate_user_id`, the `affiliate_amount` is calculated and stored on the `Order` row at that moment. Subsequent changes to the product's commission rate or the affiliate relationship do not retroactively affect that order.

**v2 Invariant 2: Affiliate previews are gated by approval.**

A smart link card that pulls live shop/ticket data renders the rich preview only when the link is on an approved affiliate's profile page or on the merchant's own page. Pasted on any other creator's page, the link renders as a plain link. This is a server-side check during page render, not a client-side hide.

**v2 Invariant 3: Charity fundraisers split at settlement, not at receipt.**

When a donor contributes to a charity fundraiser, the full amount lands in Pesapal's escrow first. At settlement (per the fundraiser auto-release timer or charity confirmation), the split is applied: charity's share to charity's MoMo number, creator's share to creator's MoMo number, platform fee to Sub-tree. The donor sees one transaction. The split is configured by the charity Business account.

**v2 Invariant 4: Content House donations route through the house wallet.**

Donations to a Content House (whole group) settle into a single house-designated MoMo number first. The house owner's per-member percentage configuration determines distribution in a batch process (weekly, or on-demand by owner). Donations to a specific member route directly to that member's personal payout number, bypassing the house wallet.

**v2 Invariant 5: Affiliate visibility is merchant-controlled.**

When a Business creator approves an affiliate, they also configure exactly which products that affiliate can promote and at what commission rate. The affiliate's dashboard shows only the products the merchant has granted them access to (`affiliate_product_grants` table). An affiliate cannot generate links for products the merchant has not explicitly granted.

**v2 Invariant 6: Smart link cards render server-side.**

Open Graph metadata fetching happens on the server during page render, with results cached in `Link.smart_card_meta` (JSON column). Client-side OG fetching is forbidden — it leaks the creator's page traffic to external sites and breaks 3G performance. Cache TTL: 7 days for most platforms, 24 hours for time-sensitive data (event tickets, product prices).

## Data Model Additions Overview

New tables in v2 (each feature file specifies its own schema):

- `teams` — Content House records
- `team_memberships` — user-to-team relationships with roles
- `team_audit_log` — every mutation by a team member
- `team_donation_splits` — per-member percentages
- `products` — Shop catalog
- `orders` — Shop purchases with escrow state
- `order_events` — append-only order state transitions
- `affiliate_relationships` — approved promoter-merchant links
- `affiliate_product_grants` — which products each affiliate can promote
- `affiliate_payout_records` — weekly batch payout audit
- `fundraisers` — campaign records
- `fundraiser_charity_links` — when a fundraiser is for a charity Business

Existing v1 tables that get new columns:

- `User` — `tier` enum gains `BUSINESS` and `CONTENT_HOUSE` values; `team_id` (nullable, for Content House members)
- `Profile` — gains Pro custom theme fields (full color customization)
- `Donation` — gains `fundraiser_id` (nullable), `affiliate_user_id` (nullable), `team_id` (nullable)
- `Link` — gains `link_type` enum (URL, SMART_CARD, AFFILIATE, FUNDRAISER), `smart_card_meta` JSON (cached OG data), `affiliate_product_id` (nullable)

## Auth and Permissions for Content Houses

v1's Clerk-based auth continues unchanged for individual users. Content Houses add a permissions layer:

- Each `team_memberships` row has a `role`: `OWNER`, `ADMIN`, `EDITOR`, `MEMBER`, `VIEWER`
- Permissions are checked at the service layer after Clerk auth confirms identity
- Pattern: `clerk auth` → look up our `User` → look up `team_membership` for resource's `team_id` → check `role` permits action

### Role permissions matrix

| Action | Owner | Admin | Editor | Member | Viewer |
|---|---|---|---|---|---|
| Add/remove members | ✓ | — | — | — | — |
| Change member roles | ✓ | — | — | — | — |
| Set donation split percentages | ✓ | — | — | — | — |
| Delete the house | ✓ | — | — | — | — |
| Edit profile/bio/avatar | ✓ | ✓ | ✓ | — | — |
| Manage links | ✓ | ✓ | ✓ | — | — |
| Create products/fundraisers | ✓ | ✓ | ✓ | — | — |
| Approve affiliate requests | ✓ | ✓ | — | — | — |
| View dashboard/analytics | ✓ | ✓ | ✓ | ✓ | ✓ |
| Receive donation share | ✓ | ✓ | ✓ | ✓ | — |
| Withdraw house earnings | ✓ | — | — | — | — |

## Realtime Considerations (Content Houses only)

Multi-user editing of the same profile requires conflict resolution. Liveblocks provides this via CRDTs.

When Feature 41 starts:

- Install Liveblocks per `docs/pending-dependencies.md`
- Integrate at the dashboard editing level only — public profile pages remain server-rendered for 3G performance
- Use Liveblocks Storage for shared state (link order, profile fields being edited)
- Use Liveblocks Presence for "Sarah is editing the bio right now" indicators
- Activity feed (who changed what, when) is written to `team_audit_log` regardless of whether Liveblocks is connected

Liveblocks is NOT used outside Content Houses. Solo creators don't need realtime sync.

## Payment Flow Modifications

The v1 Pesapal + OpenFloat aggregator integration (Feature 36) is the foundation for all v2 payment flows. v2 adds:

**Shop escrow (Feature 39):**
- Buyer pays via Pesapal
- Funds held in Pesapal's escrow (NOT in Sub-tree's account)
- After auto-release timer (3/7/14 days) with no dispute, Pesapal releases to creator's MoMo
- Sub-tree platform fee deducted at release time

**Affiliate batch payouts (Feature 40):**
- Affiliate commission is calculated and locked at order time, stored on the `Order` row
- After the order's escrow releases successfully, the commission becomes "eligible for payout"
- Weekly batch job (Vercel Cron) aggregates all eligible commissions per affiliate and issues a single Pesapal disbursement
- `affiliate_payout_records` table tracks the batch payouts (append-only)

**Charity fundraiser splits (Feature 38):**
- Donation arrives via Pesapal
- At settlement, Pesapal splits per the configured ratio (e.g., 90% charity, 10% creator)
- Each party receives their share directly to their MoMo number
- Sub-tree's fee comes off the top before the split

**Content House donations (Feature 41):**
- Group donation: settles to house-designated MoMo number (owner's responsibility to set)
- Member-specific donation: settles directly to that member's MoMo number
- Per-member split distribution is a separate manual or scheduled batch action initiated by the house owner

## Open Architectural Questions

These must be resolved before the corresponding feature is built:

- **Pesapal escrow coverage** (blocks Feature 39): does Pesapal's BoU license cover the escrow + split semantics we need?
- **Liveblocks pricing at expected Content House count** (blocks Feature 41): free tier is 50 MAU; paid tiers scale per connected user. Need projected count to estimate.
- **Smart link cache invalidation** (blocks Feature 42 polish): when a ticket sells out or a product is delisted, how do we invalidate the cache fast enough? Likely TTL + manual "refresh" button.
- **Affiliate fraud detection** (blocks Feature 40 launch): an affiliate could buy through their own link with a different phone. Need basic detection (same-payment-method-different-order patterns) before launching publicly.
- **Content House member departure** (blocks Feature 41 ship): what happens to a member's contributed products, links, and donation history when they leave? Soft-archive their contributions or delete? Probably soft-archive but needs product decision.
