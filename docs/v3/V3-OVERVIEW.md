# Sub-tree v3 — Overview

## Status

In planning. v3 begins after v2 ships and the platform has 500+ active creators.
The v3 scope here reflects all planning decisions made as of 2026-05-25.

## What v3 Is

v3 makes Sub-tree two-sided. v1 and v2 are creator-first — creators build pages,
fans consume them. v3 gives fans their own identity, their own dashboard, and their
own experience of the platform. Sub-tree becomes a creator economy network, not just
a link page tool.

The core shift: **every signup starts as a fan account**. Becoming a creator is an
upgrade, not the default. This is the same model Ko-fi uses — fans have handles,
public profiles, a feed, support history, and the ability to upgrade to creator in
one tap.

## Revised Account Structure

```
Every signup → Fan Account (free, always)
                    ↓
              "Become a Creator" (hamburger menu)
                    ↓
         User chooses their tier:

    Basic (free)        Pro (~UGX 15k/mo)      Business (~UGX 40k/mo)    Content House (~UGX 80k/mo)
    ─────────────       ─────────────          ──────────────────        ─────────────────────────────
    Unlimited links     Everything Basic        Everything Pro            Everything Business
    Donate button       + Custom themes         + Shop                    + Multi-user (up to 10)
    Basic analytics     + Fundraiser            + Affiliate network       + Shared dashboard
    Public page         + Full analytics        + Lower fees              + Group donations
                        + Lower fees            + Verified badge          + Per-member splits
                        + Verified badge
```

Fan identity is PRESERVED on upgrade. Handle, follow history, support history, and
fan profile carry over. The creator page is added on top — nothing is replaced.

One Clerk user, one database User record, one handle. `account_type` changes from
`FAN` to `INDIVIDUAL` (Basic), `PRO`, `BUSINESS`, or `CONTENT_HOUSE`.

## The Fan Portal (what v3 fans see)

Based on Ko-fi reference, adapted for Sub-tree's EA market:

### Fan Dashboard — 5 tabs

1. **Feed** — activity stream + posts from followed creators
2. **Following** — grid of followed creators
3. **Exclusive** (⭐ star icon) — subscriber-only content from creators they pay
4. **Orders** — what they bought: subscriptions, digital downloads, physical products
5. **Messages** — messages received from creators (creator-initiated only)

### Hamburger menu (≡ top right)
- Home
- Your page
- Settings
- **My support** section: Payments & orders, Messages
- Account & billing
- Help
- Log out
- **"Become a creator"** button at bottom

### Fan public profile (`sub-tree.com/theirhandle`)
- Avatar, display name, "Supporter" badge
- Stats: Following count, Followers count, Total given
- Privacy toggles (public profile, show following, show support history)
- About tab: bio + recent support history
- "Creators I support" tab: grid of creators they've donated to

## How v3 Inherits from v1 and v2

v3 does not replace v1 or v2. It builds on top of both.

- v1 creator features (links, donations, analytics, webhooks) work identically
- v2 tier features (themes, fundraiser, shop, affiliate, content houses) work identically
- v3 adds the fan layer on top — new tables, new routes, new UI context for fan users
- The fan account is an `account_type = FAN` user in the SAME `User` table v1 uses
- Clerk auth is unchanged — one account, one identity, one handle
- Pesapal/OpenFloat payment rails (v1 Feature 36) power subscription billing in v3

**Read order for Claude Code working on v3:**
1. `docs/CLAUDE.md` → `docs/PROJECT-OVERVIEW.md` → `docs/ARCHITECTURE.md` →
   `docs/UI_CONTEXT.md` → `docs/STANDARDS.md` → `docs/WORKFLOW.md` →
   `docs/PROGRESS.md` → `docs/features-specs.md` → `docs/pending-dependencies.md`
2. `docs/v2/V2-OVERVIEW.md` → `docs/v2/V2-ARCHITECTURE.md` → `docs/v2/V2-FEATURES.md`
3. `docs/v3/V3-OVERVIEW.md` → `docs/v3/V3-ARCHITECTURE.md` → `docs/v3/V3-FEATURES.md`
4. The specific v3 feature file being built

v1 docs = foundation. v2 docs = additions. v3 docs = further additions.
All three apply together.

## What v3 Does NOT Include

- **Make-a-Wish (personalized video)** — needs market validation before spec
- **Subscription Content as a Patreon-replacement** — MoMo recurring billing needs
  Pesapal confirmation before build
- **Multi-level affiliate** (affiliates of affiliates) — fraud risk
- **Cross-platform affiliate** (non-Sub-tree shops)
- **Sub-tree-issued tickets with QR/capacity management** — we process payments only
- **Native iOS/Android apps** — responsive web still
- **Fan-to-creator DMs initiated by fans** — creator-initiated only (Feature 62)
- **Fan-to-fan messaging** — no fan social network

## Platform Fee Model (all tiers, all features)

All fees are configurable from the admin dashboard (Feature 63 — Platform Settings).
No hardcoded percentages anywhere in the codebase.

| Flow | Default fee | Configurable |
|---|---|---|
| Donations — Free | 5% | ✓ admin |
| Donations — Pro/Business/CH | 3% | ✓ admin |
| Shop sales | 8% | ✓ admin |
| Fundraiser — Free | 5% | ✓ admin |
| Fundraiser — Pro+ | 3% | ✓ admin |
| Subscriptions | 5% flat (default) | ✓ admin |
| Subscription progressive | Toggle in admin | ✓ admin |
| Affiliate min payout | UGX 5,000 | ✓ admin |
| Escrow release days | 7 days default | ✓ admin |

Subscription fees: flat 5% at launch. Admin can toggle progressive mode
(7% under 100 subscribers → 4% over 100 subscribers) once real data exists.
Fee taken on every monthly renewal automatically via Pesapal.

## Build Order

1. **Feature 63 — Platform Settings** (before anything else — backfill into v1/v2)
2. **Feature 43 — Fan Accounts & Platform Structure** (foundation for all of v3)
3. **Feature 44 — Follow System** (within Feature 43)
4. **Feature 45 — Fan Feed** (needs follows)
5. **Feature 61 — Creator Posts** (what populates the feed)
6. **Feature 46 — Fan Support History** (within Feature 43)
7. **Feature 48 — Creator Follower Dashboard** (small, builds on follows)
8. **Feature 49 — Fan Notifications** (builds on feed events)
9. **Feature 51 — Subscription Content** (gated on Pesapal recurring confirmation)
10. **Feature 52 — Fan Membership Tiers** (builds on subscriptions)
11. **Feature 62 — Chat System** (builds on fan accounts)
12. **Feature 55 — Fan Discovery** (builds on follow graph)
13. **Feature 54 — Ticketing Commission** (needs platform partnerships)
14. **Feature 56 — Dark Mode** (Pro, deferred from v1)
15. **Feature 57 — Custom Domains** (Pro, deferred from v1)
16. **Feature 58 — Kenya M-Pesa** (deferred from v1)
17. **Feature 59 — USSD Donations** (deferred from v1)
18. **Feature 60 — EFRIS Tax Receipts** (deferred from v1)

Total estimated v3 build: 18-24 weeks of focused development.

## Prerequisites Before v3 Starts

- v1 live with real money flowing (Pesapal integrated, STK push wired)
- v2 has shipped: Pro Themes + Fundraiser (fans need things to engage with)
- 500+ active creators on the platform
- At least one creator has asked "can fans follow me without donating?" →
  validates Feature 44 before building
- Feature 63 (Platform Settings) backfilled into v1 before any v3 work starts

## v3 Success Criteria

1. New user can sign up as a fan (not creator), claim a handle, and see a feed
   within 2 minutes — without going through any creator setup
2. A fan can follow a creator and see their posts in the Exclusive tab if subscribed
3. A fan's Payments & Orders shows all purchases across all creators — subscriptions
   with renewal dates, digital downloads with download button, physical products
   with delivery timeline
4. A fan can tap "Become a creator" from the hamburger menu, choose Basic, and
   immediately have a creator page at their existing handle
5. An existing v1/v2 creator sees their account upgraded to "Basic creator" with a
   fan dashboard added — no disruption to their existing page
6. Creator can post text + image + link content; followers see it in their feed
7. Creator can message a filtered subset of fans; fans receive and reply
8. Platform fees are configurable from admin dashboard without code deploy
