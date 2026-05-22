# 38 — Fundraiser

## Status

Proposed

## Date

2026-05-21

## Context Links

- `docs/PROJECT-OVERVIEW.md` — Pro tier scope
- `docs/ARCHITECTURE.md` — payments, direct settlement, append-only financial records
- `docs/features/15-donation-flow.md` — donation flow baseline (Partial — UI shipped, STK pending aggregator)
- `docs/features/16-payment-webhooks.md` — webhook handler pattern
- `docs/features/36-payment-aggregators.md` — Pesapal + OpenFloat integration (Greenlit)
- `docs/v2/V2-ARCHITECTURE.md` — Invariant 3 (charity split at settlement)

Read those first. This file documents what is new.

## Why

The donate button is open-ended — no goal, no deadline, no cause context. Creators running campaigns (medical bills, studio equipment, community projects, school fees, NGO drives) need a structured fundraiser with a visible goal and progress. This gives donors context ("UGX 450,000 raised of UGX 2,000,000 goal") and drives urgency.

Differentiates Pro from free in a way creators immediately understand. Also opens charity-creator partnerships when the campaign is for a charity Business account.

## User Flow

### Personal fundraiser (creator runs for themselves)

1. Pro creator goes to Dashboard → Fundraisers → New Fundraiser
2. Declares: "For myself" or "For a charity"
3. If personal: enters title, cause description, goal amount (UGX), deadline (optional), cover image (optional)
4. Sets the fundraiser as active
5. Active fundraiser appears as a prominent card on their public profile page above their links

### Charity fundraiser (creator runs for a charity Business)

1. Pro creator selects "For a charity"
2. Searches for the charity by handle (must be an approved Business account on Sub-tree)
3. Sends a "campaign request" to the charity
4. Charity Business receives notification, reviews, approves/rejects
5. On approval: campaign goes live with the split configured by the charity (e.g., 90% charity, 10% creator)
6. Funds settle directly per the split at the Pesapal layer — Sub-tree does not hold funds

### Visitor donates to a fundraiser

1. Visitor sees the fundraiser card on the creator's profile page
2. Taps "Support this cause"
3. Lands on a fundraiser-specific donation page (similar to donate page but shows fundraiser context — title, progress, goal, deadline)
4. Enters MoMo number and amount
5. Pesapal STK push, PIN approval
6. Progress bar on the creator's public page updates within 30 seconds (cache refresh)

### Creator manages fundraisers

- Dashboard shows: total raised, supporter count, progress vs goal, days remaining
- Can have multiple fundraisers but only one active/featured at a time on profile
- Can close early or extend deadline
- Can download supporter list (phone, amount, date) as CSV
- For charity fundraisers: dashboard shows charity-side state (pending approval, approved, rejected)

### Charity Business manages incoming campaign requests

- Dashboard → Fundraisers → Campaign Requests
- Sees list of creators who applied to fundraise for this charity
- Approves or rejects with optional reason
- Sets default split percentage (creator gets X%, charity gets Y%) — applies to all approved campaigns
- Can suspend/reject specific creators if behavior is off-brand

## What Changes

### New behavior
- Fundraiser declaration step (personal vs charity)
- Charity affiliation request flow (creator → Business)
- Charity approval queue in Business dashboard
- Fundraiser card on public profile page (above links when active)
- Dedicated fundraiser donation page at `/[username]/fundraiser/[id]`
- Progress bar (raised vs goal)
- Charity split at settlement (Pesapal handles the actual split)
- Multiple fundraisers per creator (one active/featured at a time)

### Modified behavior
- Public profile page: checks for active fundraiser and renders card above link stack if present
- Donation flow accepts a `fundraiser_id` parameter that links the donation to the fundraiser
- Donations table: gets `fundraiser_id` nullable column linking to Fundraiser

### Unchanged
- Regular donate button still works independently
- Donation mechanics (STK push, webhook, settlement) identical for personal fundraisers
- For charity fundraisers, Pesapal's split-at-settlement does the work — our donation flow doesn't change shape

## Data Model Changes

```prisma
model Fundraiser {
  id                Int       @id @default(autoincrement())
  user_id           Int       // creator running the campaign
  fundraiser_type   FundraiserType @default(PERSONAL)
  title             String
  description       String    @db.Text
  goal_amount       BigInt    // in UGX (smallest unit)
  raised_amount     BigInt    @default(0) // denormalized for display
  deadline          DateTime?
  cover_image_url   String?
  show_progress     Boolean   @default(true)
  status            FundraiserStatus @default(DRAFT)

  // Charity fields (null for personal fundraisers)
  charity_user_id              Int?
  charity_approval_status      CharityApprovalStatus?
  charity_split_creator_pct    Int?      // 0-100; must sum to 100 with charity_pct
  charity_split_charity_pct    Int?      // 0-100
  charity_approved_at          DateTime?
  charity_rejected_at          DateTime?
  charity_rejection_reason     String?

  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt

  user              User      @relation("user_fundraisers", fields: [user_id], references: [id])
  charity_user      User?     @relation("charity_fundraisers", fields: [charity_user_id], references: [id])
  donations         Donation[]

  @@index([user_id])
  @@index([charity_user_id])
  @@index([status])
}

enum FundraiserType {
  PERSONAL
  CHARITY
}

enum FundraiserStatus {
  DRAFT
  ACTIVE
  CLOSED
  COMPLETED  // goal reached
  EXPIRED    // deadline passed without reaching goal
}

enum CharityApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}
```

Add to `Donation`:

```prisma
fundraiser_id    Int?
fundraiser       Fundraiser? @relation(fields: [fundraiser_id], references: [id])

@@index([fundraiser_id])
```

Migration: `feature_38_fundraisers`

## API Surface

```
POST   /api/fundraisers                        — create fundraiser (Pro+ only)
GET    /api/fundraisers                        — list caller's fundraisers
PATCH  /api/fundraisers/[id]                   — update title/description/goal/deadline/status
DELETE /api/fundraisers/[id]                   — soft-delete (sets status = CLOSED)

POST   /api/fundraisers/[id]/activate          — set as active (deactivates previous active)
POST   /api/fundraisers/[id]/close             — close early

POST   /api/fundraisers/[id]/charity-request   — send campaign request to a charity Business
PATCH  /api/fundraisers/[id]/charity-request   — charity approves/rejects (Business only)

GET    /api/fundraisers/[id]/supporters        — paginated list (creator only)
GET    /api/fundraisers/[id]/supporters.csv    — CSV export

GET    /api/charity/campaign-requests          — incoming requests (Business only)
```

`fundraiser_id` added to the existing donation initiation payload (`POST /api/payments/initiate`). The webhook handler (`POST /api/webhooks/payments`) already increments donation state — extend it to also update `Fundraiser.raised_amount` when a donation with a `fundraiser_id` completes.

## Scope

### In scope
- Personal and charity fundraiser types
- Goal, deadline, cover image, description
- Progress bar on public profile page (raised / goal)
- Fundraiser-specific donation page
- One active fundraiser featured on profile at a time
- Charity campaign request flow and approval queue
- Pesapal split-at-settlement for charity fundraisers
- CSV export of supporters
- Fundraiser dashboard: raised, supporter count, days remaining

### Out of scope
- Recurring donations to fundraisers (MoMo doesn't support auto-charge)
- Refunds (handled manually via Pesapal dashboard if needed)
- Public discovery of fundraisers across Sub-tree (creators share their own link)
- Fundraiser comments or donor messages beyond the existing donation note field
- Fundraiser tiers/perks (not v2)
- Video or embedded media in fundraiser description

## New Invariants

This feature operates under v2 Invariant 3 (charity fundraisers split at settlement, not at receipt). No additional v2-level invariants.

Service-level rules:
- `raised_amount` is updated by the webhook handler only — never by client calls
- Charity split percentages must sum to exactly 100 (validated on save)
- A fundraiser in `CLOSED`, `COMPLETED`, or `EXPIRED` status cannot be activated
- A creator can have at most one `ACTIVE` fundraiser at a time — activating a new one deactivates the current one
- Charity split configuration is set by the charity Business, not by the creator

## Success Criteria

1. A Pro creator can create a personal fundraiser and see it appear as a card on their public profile within 1 minute
2. A donor can donate to a fundraiser via the fundraiser-specific donation page with no change to the MoMo flow
3. The progress bar updates within 30 seconds of a completed donation
4. A creator can send a campaign request to a charity and the charity can approve it from their dashboard
5. For an approved charity fundraiser, the donation split is applied at settlement — the charity's MoMo number receives the charity's share directly
6. A Free creator cannot create a fundraiser (route returns 403)
7. A creator cannot have more than one ACTIVE fundraiser — activating a second one deactivates the first
8. `npm run build` passes with no type errors

## Migration Plan

All new tables. No changes to existing data. Existing donations without a `fundraiser_id` are unaffected.

The `Donation.fundraiser_id` column is nullable — zero risk to existing rows.

`raised_amount` is a denormalized counter updated by the webhook handler. On first deploy, it is 0 for all fundraisers (there are none). No backfill needed.

## Open Questions

- Cover image upload: depends on Vercel Blob (pending dependency). At MVP, accept a URL instead and add upload later.
- Charity Business verification: how do we decide which Business accounts qualify as charities? Recommend a manual approval flag (`user.is_verified_charity`) set by Sub-tree admin. Defer enforcement to after first charity partner onboards.
- `raised_amount` consistency: if a webhook fires twice for the same donation (Pesapal retry), the counter double-increments. The webhook handler already deduplicates by `external_reference` — confirm that dedup guard also skips the `raised_amount` increment.
- Fundraiser page SEO: the fundraiser page should have its own OG image (title, progress, goal). Low priority for MVP — add in a polish pass.
