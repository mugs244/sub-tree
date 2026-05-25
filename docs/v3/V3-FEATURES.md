# v3 Features — Master Index

Canonical index of all v3 features. Continues numbering from v2 (which ended at 42).
Feature 63 is the prerequisite for all v3 monetization — build it first.

## How This Connects to v1 and v2

- v1 features: `docs/features-specs.md` (Features 01–36)
- v2 features: `docs/v2/V2-FEATURES.md` (Features 37–42)
- v3 features: this file (Features 43–60+)

All three feature sets are active and inherited. v3 does not replace v1 or v2.

## Status Legend

| Status | Meaning |
|---|---|
| Proposed | Spec exists, not yet greenlit |
| Greenlit | Approved to build, waiting in queue |
| In Progress | Actively being built |
| Shipped | Live in production |
| Deferred | Scope valid, not now |
| Deprecated | Was shipped, now removed |

## Feature Index

| # | Feature | Tier | Status | Depends On | File |
|---|---|---|---|---|---|
| 43 | Fan Accounts & Two-Sided Platform | All | Proposed | v1: 03, 04; v2: 37+ | `docs/v3/features/43-fan-accounts.md` |
| 44 | Follow System | All | Proposed | Feature 43 | (within 43) |
| 45 | Fan Feed | All | Proposed | Feature 44 | `docs/v3/features/45-fan-feed.md` |
| 46 | Fan Support History | All | Proposed | Feature 43 | (within 43) |
| 47 | Fan-to-Creator Upgrade | All | Proposed | Feature 43 | (within 43) |
| 48 | Creator Follower Dashboard | Creator tiers | Proposed | Feature 44 | `docs/v3/features/48-follower-dashboard.md` |
| 49 | Fan Notifications | All | Proposed | Feature 45 | `docs/v3/features/49-fan-notifications.md` |
| 50 | Make-a-Wish | Business+ | Deferred | Market validation required | (future-ideas.md) |
| 51 | Subscription Content | Pro+ | Proposed | Feature 43 + Pesapal recurring confirm | `docs/v3/features/51-subscriptions.md` |
| 52 | Fan Membership Tiers | Pro+ | Proposed | Feature 51 | `docs/v3/features/52-membership-tiers.md` |
| 53 | ~~Creator-Fan Direct Message~~ | — | Superseded | by Feature 62 | — |
| 54 | Ticketing Commission | All | Deferred | Platform partnerships required | (future-ideas.md) |
| 55 | Fan Discovery | All | Proposed | Features 43, 44, 45 | `docs/v3/features/55-fan-discovery.md` |
| 56 | Dark Mode | Pro+ | Deferred | v2 must ship first | `docs/v3/features/56-dark-mode.md` |
| 57 | Custom Domains | Pro+ | Deferred | v2 must ship first | `docs/v3/features/57-custom-domains.md` |
| 58 | Kenya M-Pesa | All | Deferred | v1 live first | `docs/v3/features/58-mpesa.md` |
| 59 | USSD Donation Flow | All | Deferred | v1 live first | `docs/v3/features/59-ussd.md` |
| 60 | EFRIS Tax Receipts | Business+ | Deferred | v2 Feature 38 (Fundraiser) | `docs/v3/features/60-efris.md` |
| 61 | Creator Posts | Creator tiers | Proposed | Feature 43 | `docs/v3/features/61-creator-posts.md` |
| 62 | Chat System (Creator DMs) | Creator tiers | Proposed | Feature 43 | `docs/v3/features/62-chat-system.md` |
| 63 | Platform Settings & Admin Fees | Admin | **Shipped** | v1 live | `docs/v3/features/63-platform-settings.md` |
| 64 | Product Categories & Shop Discovery | Business, CH | Greenlit | Feature 39, v3 Feature 43 | `docs/v3/features/64-product-categories.md` |
| 65 | Media File Upload (Profiles, Products, Fundraisers) | All tiers | Greenlit | Feature 43 (Fan Accounts) | `docs/v3/features/65-media-file-upload.md` |

## Build Order

### Phase 1 — Foundation (build before anything else)

**Feature 63 — Platform Settings** ✅ Shipped. Backfill complete — `lib/services/shop.ts`
and `lib/services/affiliate.ts` now use `getFeeRate()` / `getSettingAsNumber()`. Admin
UI at `/admin/settings`. The next v3 task is Feature 43 — Fan Accounts.

### Phase 2 — Fan Identity (everything else depends on this)

1. **43 — Fan Accounts** (includes 44 Follow System, 46 Support History, 47 Upgrade)
2. **45 — Fan Feed**
3. **61 — Creator Posts** (what populates the feed — useless without this)
4. **48 — Creator Follower Dashboard** (small, builds creator trust in the system)
5. **49 — Fan Notifications**

### Phase 3 — Fan Engagement

6. **51 — Subscription Content** (gated on Pesapal recurring confirmation)
7. **52 — Membership Tiers** (builds on subscriptions)
8. **62 — Chat System**
9. **55 — Fan Discovery**

### Phase 3b — Shop & Creator Tools (build alongside Phase 3)

- **64 — Product Categories** (alongside or after Feature 43 — required before shop is publicly discoverable)
- **65 — Media File Upload** (alongside Feature 43 — blocks shop file delivery and profile customisation from feeling complete)

### Phase 4 — Expansion (when v3 core is live)

10. **56 — Dark Mode** (Pro, was deferred from v1)
11. **57 — Custom Domains** (Pro, was deferred from v1)
12. **58 — Kenya M-Pesa** (regional expansion)
13. **59 — USSD** (feature phone donations)
14. **60 — EFRIS Tax Receipts**

### Permanently Deferred (need external validation)

- **50 — Make-a-Wish**: needs market validation via manual experiment first
- **54 — Ticketing Commission**: needs signed partnership with Quicket/Mookh/Tika

## Gates and Blockers

| Feature | Blocked until |
|---|---|
| 51 (Subscriptions) | Pesapal confirms recurring billing support |
| 52 (Membership Tiers) | Feature 51 ships |
| 62 (Chat) | Feature 43 ships |
| 54 (Ticketing) | Partnership agreement signed with at least one EA ticketing platform |
| 50 (Make-a-Wish) | 5 real personalized video requests completed manually (no code) to validate demand |

## Fan Portal Reference

The fan portal mockup (FanPortal.jsx in repo) shows the complete fan-side UX:

- **Feed tab**: activity + posts from followed creators
- **Following tab**: grid of followed creators
- **Exclusive tab (⭐)**: subscriber-only content, locked previews for non-subscribers
- **Orders tab**: subscriptions + digital purchases + physical products with full detail
- **Messages tab**: creator-initiated conversations, fan can reply
- **Hamburger menu (≡)**: Home, Your page, Settings, Payments & orders, Messages,
  Account & billing, Help, Log out, "Become a creator" button

This mockup is the design reference for Features 43, 45, 51, 61, 62.
