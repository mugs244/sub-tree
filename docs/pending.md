# Pending Features

Features that exist in the codebase but are parked until the core product is
proven. The goal is a lean Free + Pro product: link page, donations, basic
appearance, and analytics. Everything below is off the active roadmap until
explicitly re-enabled.

When re-enabling a feature, move it back to the relevant feature spec and
update `PROGRESS.md`.

---

## Posts & Post Composer

**What it is:** Creator post composer with text + links, visibility levels
(PUBLIC / SUPPORTERS_ONLY / SUBSCRIBERS_ONLY), pin, like, soft-delete, and a
public Posts tab on creator profiles.

**Code that exists:**
- `app/(dashboard)/dashboard/posts/` — dashboard posts page
- `app/api/posts/` — CRUD + like + pin routes
- `app/api/public/[handle]/posts/` — public posts with visibility gating
- `components/PublicProfileTabs.tsx` — Links | Posts switcher on public profile
- `lib/services/fan.ts` → `getFanFeed` — feeds posts to fans
- Schema: `Post`, `PostLink`, `PostLike`, `FeedEvent`, `PostVisibility` enum,
  `FeedEventType` enum

**Why parked:** Adds complexity (visibility model, feed events, like system)
before the core link-page + donation flow is proven at scale.

**Re-enable when:** Core donation/link product has traction and creators are
asking for content publishing.

---

## Fan Feed

**What it is:** A feed for fan accounts showing posts from creators they follow.
Tabs: Feed / Following / Support.

**Code that exists:**
- `app/(fan)/` — route group with `FanNav` layout
- `app/(fan)/fan/feed/` — feed page
- `app/(fan)/fan/following/` — following list + unfollow
- `app/(fan)/fan/support/` — fan donation history
- `lib/services/fan.ts` → `getFanFeed`, `getFanFollowing`, `getFanSupportHistory`

**Why parked:** Fan-side UX is only valuable once creators have posts to show.
Parked together with Posts.

**Re-enable when:** Posts feature is re-enabled and creators are publishing.

---

## Follow Button

**What it is:** A Follow / Unfollow button rendered on every creator's public
profile page. Logged-in fans can follow a creator; unauthenticated visitors are
sent to `/fan/join/[handle]` to create a fan account first. A follower count is
shown below the button. Fans can manage who they follow from the `/fan/following`
dashboard tab.

**Code that exists:**
- `components/FollowButton.tsx` — Follow / Unfollow toggle with optimistic count
- `app/api/fan/follow/[handle]/route.ts` — POST (follow) / DELETE (unfollow)
- `app/fan/join/[handle]/page.tsx` — fan sign-up/sign-in prompt triggered by unauthenticated follow attempt
- `app/(fan)/fan/following/` — fan's following list page
- `components/FanFollowingClient.tsx` — client component for the following list
- `lib/services/fan.ts` → `followCreator`, `unfollowCreator`, `getFanFollowing`
- Schema: `Follow` model (fan_id → creator_id unique pair)
- Public profile (`app/[username]/page.tsx`) — renders `<FollowButton>` after creator bio

**Why parked:** Follows are only meaningful when there is a feed — without
Posts, following a creator has no visible effect for the fan. The fan account
system (Fan Feed section) is also parked, making the follow graph orphaned.

**Re-enable when:** Fan Feed and Posts are re-enabled so that follows drive a
visible feed experience.

---

## Fan Membership Tiers (Creator-defined tiers for fans)

**What it is:** Creators define Bronze / Silver / Gold style subscription tiers
with a name, price (UGX), description, and perk list. Fans choose a tier when
subscribing. Shown as a pricing card on the public profile.

**Code that exists:**
- `lib/services/membership-tiers.ts` — CRUD service
- `app/api/creator/tiers/` — GET / POST / PATCH / DELETE
- Dashboard: tier management UI under `/dashboard/subscriptions`
- Public profile: pricing card shown when creator has active tiers
- Schema: `MembershipTier` model

**Why parked:** The fan payment side (Feature 51 — recurring Pesapal billing) is
not confirmed. Tier display without payment is an incomplete feature. Parked
with Subscription Content below.

**Re-enable when:** Pesapal confirms recurring billing support (Feature 51
blocker resolved).

---

## Subscription Content (Feature 51)

**What it is:** Fans pay a monthly fee to subscribe to a creator. Unlocks
SUBSCRIBERS_ONLY posts. Wired to the MembershipTier the fan selects on the
public profile.

**Code that exists:**
- `lib/services/subscription.ts` — subscription service
- `app/api/subscriptions/` — initiate + status routes
- `app/api/webhooks/payments/subscription/` — webhook handler
- Schema: `Subscription`, `SubscriptionEvent`, `SubscriptionStatus` enum

**Why parked:** Blocked on Pesapal confirming recurring monthly charge support
for stored MoMo numbers. Cannot wire the Subscribe button without a working
recurring billing rail.

**Re-enable when:** Pesapal recurring billing is confirmed and tested in sandbox.

---

## Bank Withdrawal

**What it is:** Creators choose "mobile money" or "bank" (plus an amount)
when withdrawing their balance, instead of always paying out to their
registered momo number. Requires bank account details (bank name, account
number, account name) captured somewhere on the creator's account.

**Code that exists:** None. The current withdraw flow
(`app/api/wallet/withdraw/route.ts` → `lib/services/client-wallet.ts` →
`lib/services/payments/openfloat.ts`'s `payout()`) only takes amount + OTP and
always pays to `User.momo_number`. `payout()`'s request shape is itself
explicitly commented as an assumption pending OpenFloat's real payout API
docs — it has never been confirmed against real disbursement documentation,
mobile or bank.

**Why parked:** No confirmed API docs for paying out to a Ugandan bank
account via OpenFloat or Pesapal (or any other rail). Building the bank
detail fields and a "mobile or bank" choice in the withdraw UI without a
working payout path behind it would mean the option either silently fails or
misleads creators into thinking a bank payout succeeded.

**Re-enable when:** Real OpenFloat and/or Pesapal disbursement-to-bank API
docs are available and the existing OpenFloat mobile-money payout() shape
itself has been verified against real docs (or replaced).

---

## Gift Me

**What it is:** Creators list specific items they want fans to buy for them —
WiFi, mobile data, and airtime (each with monthly / weekly / daily cadence
options), plus DSTV and other TV subscriptions. Each item has creator-filled
details (e.g. account/meter number, package). Monthly items must be paid in
full — no partial or installment payments. Unlike a normal donation, the money
is never handed to the creator as cash: the platform is meant to automatically
purchase the actual utility/subscription on the creator's behalf using the
details they provided.

**Code that exists:**
- Schema: `Profile.gift_me_enabled` (visibility toggle only)
- Dashboard: Settings toggle to show/hide the section on the public profile
- Public profile: coming-soon placeholder section, shown only when the toggle
  is on

**Why parked:** Automated fulfillment requires a confirmed bill-payment /
utility API (WiFi, mobile data, airtime, DSTV) that the platform can call to
actually purchase the item — no such integration exists yet. Building the
catalog and payment collection without real fulfillment would mean either
silently failing to deliver the item or defeating the point of the feature by
paying the creator directly instead, which the creator explicitly does not
want. Only the visibility toggle exists so creators can preview the feature;
the underlying catalog, payment, and fulfillment pipeline are not built.

**Re-enable when:** A bill-payment/utility API is confirmed and integrated
(e.g. an aggregator covering WiFi, mobile data, airtime, and DSTV top-ups in
Uganda).

---

## Fundraiser Campaigns

**What it is:** Creators run fundraiser campaigns with a goal amount, deadline,
cover image, progress bar, and charity split option. Donors give via the normal
MoMo flow. Charity campaigns require admin verification.

**Code that exists:**
- `app/(dashboard)/dashboard/fundraisers/` — full dashboard CRUD
- `app/[username]/fundraiser/[id]/` — public fundraiser page
- `app/api/fundraisers/` — CRUD routes
- `app/admin/` — charity verification queue
- `lib/services/fundraiser.ts` — service layer (gate: `PRO_TIERS`)
- Schema: `Fundraiser`, `FundraiserDonation`, `CharityVerificationRequest`,
  `FundraiserType`, `FundraiserStatus`, `CharityApprovalStatus` enums

**Why parked:** Adds regulatory surface area (charity verification) and product
complexity before the simpler donation flow is validated.

**Re-enable when:** Core donation product is working and creators explicitly
request campaign tooling.

---

## Affiliate Network — Promoter role (Pro)

**What it is:** Pro creators can apply to promote a Business creator's products
as an affiliate. Earn a commission rate per product. Dashboard tab shows
relationships, grants, and payout history.

**Code that exists:**
- `app/(dashboard)/dashboard/affiliates/` — affiliate dashboard
- `app/api/affiliates/` — apply, accept, reject, grant routes
- `app/api/cron/affiliate-payouts/` — weekly payout cron
- `lib/services/affiliate.ts` → `applyAsAffiliate` (gate: `PRO_TIERS`)
- Schema: `AffiliateRelationship`, `AffiliateProductGrant`, `AffiliatePayoutRecord`

**Why parked:** The merchant side (Business tier) is also parked. Without
Business-tier merchants there is no one to promote. Both sides need to be
re-enabled together.

**Re-enable when:** Shop / Business tier is re-enabled and there are real
merchants with products to promote.

---

## Shop & Affiliate Network — Merchant role (Business tier)

**What it is:** Business-tier creators can list digital and physical products,
manage orders, handle escrow and disputes, and invite affiliate promoters.

**Code that exists:**
- `app/(dashboard)/dashboard/shop/` — full shop dashboard (products + orders)
- `app/[username]/shop/` — public storefront
- `app/admin/disputes/` — dispute management
- `app/api/shop/` — product + order routes
- `lib/services/shop.ts` — service layer (gate: `BUSINESS_TIERS`)
- Schema: `Product`, `Order`, `OrderEvent`, `DigitalDownload`, `EscrowRelease`,
  `Dispute`, `ProductType`, `ProductStatus`, `EscrowStatus` enums

**Why parked:** Requires Business tier which is being removed from the active
plan picker. Complex escrow + dispute lifecycle is not needed for the lean MVP.

**Re-enable when:** Business tier is re-introduced and there is demand for
creator e-commerce.

---

## Business Tier

**What it is:** UGX 40,000/mo plan. Includes everything in Pro plus: product
shop, affiliate merchant capability, and (aspirational) up to 5 team members
with a shared dashboard.

**Why parked:** Product surface is too wide for the current stage. Removing it
simplifies the plan picker to Free + Pro and removes dead-end nav items for
most users.

**Re-enable when:** Free + Pro product is live, stable, and creators are
outgrowing Pro.

---

## Content House Tier

**What it is:** UGX 80,000/mo plan for multi-creator studios. Everything in
Business plus: up to 10 members, donation splits by share rate, setup via admin
review, dedicated onboarding.

**Code that exists:**
- `app/content-house/` — application form
- `app/admin/` — content house review queue
- Schema: `ContentHouseRequest`, `ContentHouseMember`,
  `ContentHouseRequestStatus` enum

**Why parked:** Multi-member management is architecturally heavier than anything
else in the product. The `donation splits by share rate` invariant and the
`ContentHouseMember` join table are not needed until multi-member accounts
exist. Parked with Business tier.

**Re-enable when:** Business tier ships and there is validated demand for
multi-creator studio accounts.

---

## Pro Tier

**What it is:** UGX 15,000/month plan. Includes: reduced donation fee (3%),
custom colours + fonts, advanced analytics, custom domain (not implemented),
fundraiser campaigns (parked separately), affiliate promoter access (parked
separately), priority support, 5-day free trial.

**Code that exists:**
- `components/PlanPicker.tsx` — plan selection component (FREE card only now)
- `app/onboarding/plan/page.tsx` — now just redirects to `/dashboard`
- `app/page.tsx` — pricing section simplified to Free-only
- `app/api/onboarding/start-trial/` — route that sets tier to PRO with `trial_ends_at`
- Schema: `UserTier` enum retains `PRO` value (no migration needed)

**Why parked:** Custom domain — the marquee Pro feature — is not implemented.
Adding a paywall before the free-tier value is proven increases sign-up friction
with no offsetting benefit at current volumes.

**Re-enable when:** Free tier is live and validated, custom domain is
implemented or a clearly differentiated Pro feature set is chosen, and creators
are actively asking for paid features.

---

## Active product after parking

What remains (Free only):

| Feature | Free |
|---|---|
| Link page + links manager | Yes |
| Donations (MoMo) | Yes |
| Transaction history + CSV | Yes |
| Page view + click analytics | Yes |
| 5 standard theme presets | Yes |
| Platform donation fee | 5% |
