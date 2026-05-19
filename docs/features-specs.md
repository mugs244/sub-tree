# Features — Master Index

This is the canonical index of every feature spec in the project. Each row points to a feature file in `docs/features/`. The status, dependencies, and target phase let you see at a glance what's done, what's in flight, and what's coming.

When a new feature is proposed, it gets a number and a row in this table. When a feature ships, its status flips and any new invariants or scope changes get absorbed back into the base spec files.

## How This File Works

- **One row per feature file** in `docs/features/`.
- **Numbers are permanent.** Once a feature is assigned `04-`, that slot is its forever — even if deprecated. Numbering is chronological by proposal date, not by build order.
- **Status reflects reality.** Don't mark something Shipped until it's live and `PROGRESS.md` confirms it. Don't mark something In Progress until code is actually being written.
- **Dependencies are honored.** If a feature depends on another, that's noted. Don't start a feature whose dependencies aren't met.
- **Update this file in the same commit** as the feature file it indexes. Index drift is documentation rot.

## Status Legend

| Status        | Meaning                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Proposed      | Feature file exists with rationale and scope. No code yet. May still be debated.                                            |
| Under Review  | Spec is being pressure-tested. Edge cases being mapped. Not yet greenlit for build.                                         |
| Greenlit      | Approved to build. Waiting for its turn in the queue.                                                                       |
| In Progress   | Active development. Visible work in commits, tracked in `PROGRESS.md`.                                                      |
| Shipped       | Live in production. New invariants and tokens absorbed back into base specs. Feature file remains as historical record.    |
| Deferred      | Scope is valid but not now. Reason and target phase noted.                                                                  |
| Deprecated    | Was shipped, now removed or replaced. Feature file kept for institutional memory.                                           |
| Superseded    | Replaced by another feature file. Points to the successor.                                                                  |

## Phase Legend

| Phase    | Window         | Theme                                                                          |
| -------- | -------------- | ------------------------------------------------------------------------------ |
| Phase 0  | Weeks 0–1      | Project setup, foundations, design system, schema.                             |
| Phase 1  | Weeks 1–3      | Authentication and creator onboarding.                                         |
| Phase 2  | Weeks 3–5      | Dashboard, link management, public profile rendering.                          |
| Phase 3  | Weeks 5–7      | Mobile money integration, donation flow, payment webhooks.                     |
| Phase 4  | Weeks 7–8      | Analytics, fraud rails, Pro tier, launch prep.                                 |
| Phase 5+ | Post-launch    | Themes, custom domains, multi-country MoMo, USSD, ecosystem integrations.      |

---

## Feature Index

| #   | Feature                              | Status      | Phase    | Depends On       | File                                              |
| --- | ------------------------------------ | ----------- | -------- | ---------------- | ------------------------------------------------- |
| 01  | Design System Setup                  | Proposed    | Phase 0  | —                | `docs/features/01-design-system.md`               |
| 02  | Database Schema & Prisma Setup       | Proposed    | Phase 0  | —                | `docs/features/02-database-schema.md`             |
| 03  | Clerk Auth Integration               | Proposed    | Phase 1  | 01, 02           | `docs/features/03-clerk-auth.md`                 |
| 04  | Username Claim & Onboarding          | Proposed    | Phase 1  | 03               | `docs/features/04-username-onboarding.md`         |
| 05  | Quick Profile & First Link Onboarding | Proposed   | Phase 1  | 03               | `docs/features/05-onboarding-profile.md`          |
| 06  | Login & Sessions                     | Superseded  | —        | by 03            | (merged into 03-clerk-auth.md)                   |
| 07  | Password Reset                       | Superseded  | —        | by 03            | (handled by Clerk, no separate file)              |
| 08  | Dashboard Shell & Navigation         | Proposed    | Phase 2  | 01, 03           | `docs/features/08-dashboard-shell.md`             |
| 09  | Links Manager (CRUD + Reorder)       | Proposed    | Phase 2  | 02, 08           | `docs/features/09-links-manager.md`               |
| 10  | Public Profile Page                  | Proposed    | Phase 2  | 02, 09           | `docs/features/10-public-profile.md`              |
| 11  | Appearance & Theme Selection (Free Tier) | Proposed | Phase 2  | 08, 10           | `docs/features/11-appearance-free.md`             |
| 12  | Reserved Username Admin Queue        | Proposed    | Phase 2  | 02, 03           | `docs/features/12-reserved-username-admin.md`     |
| 13  | MTN MoMo Collections Integration     | Proposed    | Phase 3  | 02               | `docs/features/13-mtn-momo-integration.md`        |
| 14  | Airtel Money Collections Integration | Proposed    | Phase 3  | 02               | `docs/features/14-airtel-money-integration.md`    |
| 15  | Donation Page & STK Push Flow        | Proposed    | Phase 3  | 10, 13, 14       | `docs/features/15-donation-flow.md`               |
| 16  | Payment Webhook Handling             | Proposed    | Phase 3  | 13, 14, 15       | `docs/features/16-payment-webhooks.md`            |
| 17  | Donation Notifications (SMS + In-App) | Proposed   | Phase 3  | 03, 16           | `docs/features/17-donation-notifications.md`      |
| 18  | Transaction History & CSV Export     | Proposed    | Phase 3  | 16               | `docs/features/18-transaction-history.md`         |
| 19  | Analytics (Page Views, Link Clicks)  | Proposed    | Phase 4  | 09, 10           | `docs/features/19-analytics.md`                   |
| 20  | Pro Tier Subscription & Billing      | Proposed    | Phase 4  | 13, 14, 19       | `docs/features/20-pro-tier.md`                    |
| 21  | Rate Limiting & Fraud Rails          | Proposed    | Phase 4  | 03, 15           | `docs/features/21-fraud-rails.md`                 |
| 22  | OG Image Generation for Profiles     | Proposed    | Phase 4  | 10               | `docs/features/22-og-images.md`                   |
| 23  | Account Settings & Deletion          | Proposed    | Phase 4  | 03               | `docs/features/23-account-settings.md`            |
| 24  | Business / NGO KYB Upgrade           | Deferred    | Phase 5  | 03, 12           | `docs/features/24-business-ngo-kyb.md`            |
| 25  | Custom Domains for Pro               | Deferred    | Phase 5  | 10, 20           | `docs/features/25-custom-domains.md`              |
| 26  | Kenya M-Pesa Integration             | Deferred    | Phase 5  | 13               | `docs/features/26-mpesa-integration.md`           |
| 27  | USSD Donation Flow (Feature Phones)  | Deferred    | Phase 5  | 15, 16           | `docs/features/27-ussd-donations.md`              |
| 28  | Pro Tier Advanced Themes             | Deferred    | Phase 5  | 11, 20           | `docs/features/28-themes-pro.md`                  |
| 29  | Ecosystem KYC Layer Integration      | Deferred    | Phase 5+ | —                | `docs/features/29-kyc-layer-integration.md`       |
| 30  | EFRIS Aggregator Hook (Tax Receipts) | Deferred    | Phase 5+ | 18, 24           | `docs/features/30-efris-tax-receipts.md`          |

---

## Phase 0 — Foundations

Goal: Project scaffolded, design system live, schema applied. No user-facing features yet. The output of this phase is a runnable Next.js project where `/dev/design-system` shows every token and primitive correctly.

- **01 — Design System Setup.** All tokens, fonts, layouts, shadcn primitives. Every subsequent feature consumes these tokens.
- **02 — Database Schema & Prisma Setup.** Initial schema for `users`, `reserved_usernames`, `profiles`, `links`, `donations`, `sessions`. Prisma migrations configured. Local Postgres via Docker. Seed script for reserved usernames.

Phase 0 is done when: `/dev/design-system` renders correctly, `npm run build` passes, Prisma migrations run cleanly against a fresh Postgres, and reserved usernames are seeded.

## Phase 1 — Authentication & Onboarding

Goal: A new user can go from "first visit" to "signed in, profile created, first link added" in under two minutes.

**03 — Clerk Auth Integration.** Install and configure Clerk for Sub-tree. Configure signup to require phone + email, with phone OTP as primary verification. Set up middleware for protected routes. Map Clerk user IDs to local user records via webhook.
**04 — Username Claim & Onboarding.** After Clerk signup completes, redirect to our onboarding flow. User claims a username (validated against reserved list), and we create the local users record linked to their Clerk ID.
**05 — Quick Profile & First Link.** Post-username screens for display name, avatar, first link.

Phase 1 is done when: a new user can complete Clerk signup, claim a username, create a profile, add a link, log out, and log back in.

## Phase 2 — Creator Dashboard & Public Profile

Goal: A signed-in creator can manage their links and themes, and their public profile renders correctly to visitors. No donations yet — that's Phase 3.

- **08 — Dashboard Shell & Navigation.** Sidebar (desktop) and bottom tabs (mobile), routes for Home, Links, Donations (placeholder), Appearance, Settings.
- **09 — Links Manager.** Add, edit, delete, drag-to-reorder, toggle enable/disable, auto-detect icons from URL.
- **10 — Public Profile Page.** Server-rendered `sub-tree.com/[username]` with avatar, bio, link stack. Click tracking. Sub-second load on 3G.
- **11 — Appearance & Theme Selection (Free Tier).** Theme presets, primary color picker, button style. Free-tier scope only.
- **12 — Reserved Username Admin Queue.** Admin-only route for reviewing reserved-name claim requests.

Phase 2 is done when: a creator can build a complete page, customize basic appearance, and a visitor can view it on a 3G connection in under a second.

## Phase 3 — Mobile Money & Donations

The hardest phase. This is where regulatory and API onboarding intersects with code. MoMo API merchant applications must already be approved by the start of this phase — otherwise the build is blocked.

- **13 — MTN MoMo Collections Integration.** The provider client, request signing, error mapping, sandbox-first then production. Provider-agnostic interface so Airtel slots in cleanly.
- **14 — Airtel Money Collections Integration.** Same shape as #13 for Airtel.
- **15 — Donation Page & STK Push Flow.** The `sub-tree.com/[username]/donate` page, amount selection, phone input with network auto-detect, STK push trigger, "check your phone" pending state.
- **16 — Payment Webhook Handling.** Signature verification, idempotency, donation record updates, event log appending. The hardest correctness work in the project.
- **17 — Donation Notifications.** SMS to creator on success, in-dashboard notification, optional email receipt to donor.
- **18 — Transaction History & CSV Export.** Dashboard table of donations with filter, status, and CSV download.

Phase 3 is done when: a real donor on a real MTN or Airtel number can complete a donation end-to-end, the creator gets an SMS, the dashboard shows the transaction, and the idempotency invariant holds under simulated double-submit testing.

## Phase 4 — Analytics, Pro, Launch Prep

Goal: The product is launch-ready. Analytics work, Pro tier is purchasable, fraud rails are in place, account management is complete.

- **19 — Analytics.** Page views, link clicks, donation conversion, top referrers. Plausible or self-hosted PostHog.
- **20 — Pro Tier Subscription & Billing.** Pro upgrade flow, MoMo recurring billing (or monthly manual renewal at MVP), tier-gated features.
- **21 — Rate Limiting & Fraud Rails.** Redis-backed rate limits on signup, OTP, donations. Suspicious-amount flagging. Account lockout for repeated abuse.
- **22 — OG Image Generation for Profiles.** Dynamic OG images so shared links show creator avatar + name correctly on WhatsApp, X, Instagram.
- **23 — Account Settings & Deletion.** Username change with cooldown, notification preferences, full account deletion with data anonymization.

Phase 4 is done when: a real creator can subscribe to Pro, abuse attempts are rate-limited, OG images render on a WhatsApp share, and an account can be deleted cleanly (with financial records preserved per the invariant).

## Phase 5+ — Post-Launch & Ecosystem

These are Deferred. They will become Greenlit individually after launch when their time comes, evidence supports them, or business needs demand them.

- **24 — Business / NGO KYB Upgrade.** Verified business accounts with tax receipts, higher donation limits, regulatory KYB flow.
- **25 — Custom Domains for Pro.** `theirname.com` → their Sub-tree page via Cloudflare for SaaS or similar.
- **26 — Kenya M-Pesa Integration.** First regional expansion. Heavier regulatory lift (CBK).
- **27 — USSD Donation Flow.** Feature-phone donors via Africa's Talking USSD. Real EA segment, real revenue.
- **28 — Pro Tier Advanced Themes.** Full theme builder, custom fonts, custom CSS for Pro creators.
- **29 — Ecosystem KYC Layer Integration.** Hook into the broader Muhamad ecosystem's KYC layer for unified identity.
- **30 — EFRIS Aggregator Hook.** Tax receipts for donations to business/NGO accounts via the Ouditax-adjacent EFRIS aggregator.

---

## Dependency Graph (Critical Path)

The fastest path to a launchable MVP runs through these features in order: