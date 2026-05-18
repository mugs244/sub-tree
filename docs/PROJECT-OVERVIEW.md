# Sub-tree

## Overview

Sub-tree is a link-aggregator platform built for creators, small businesses, and organizations across East Africa and beyond. Users get a single shareable page at sub-tree.com/username that hosts all their important links — social profiles, websites, WhatsApp, music, shops — and can accept tips and donations directly through mobile money (MTN MoMo, Airtel Money) without the friction of card payments. It solves the problem that global tools like Linktree ignore: in markets where most people don't have credit cards, creators can't actually monetize their audience because their fans have no way to pay them.

## Goals

1. Launch a working MVP within 8 weeks where a creator can sign up, build a link page, and receive at least one successful donation via mobile money.
2. Acquire 1,000 verified creator accounts within 90 days of launch, with at least 20% of pages receiving a donation in their first 30 days.
3. Maintain a sub-2-minute signup-to-live-page completion time and a donation success rate above 90% on completed STK pushes.

## Core User Flow

1. Creator visits sub-tree.com and signs up with phone, email, password, and chosen username.
2. Creator verifies their phone number via a 6-digit OTP sent by SMS.
3. Creator completes a quick profile (display name, optional avatar) and adds their first link.
4. Creator lands in the dashboard, adds remaining links, customizes appearance, and turns on donations by entering their payout mobile money number.
5. Creator shares their sub-tree.com/username link with their audience.
6. A visitor opens the public page, sees all the creator's links, and taps "Donate."
7. Visitor enters their mobile money number and donation amount on the donation page.
8. Visitor receives an STK push on their phone, enters their PIN, and the donation completes.
9. Creator gets an SMS notification of the received donation and sees it in their dashboard.

## Features

### Authentication & Account

- Phone + email signup with hard phone verification (OTP via Africa's Talking) and soft email verification (background link).
- Username system with reserved-word handling (system names, government bodies, major brands) and admin review queue for reserved-name claims.
- Account types: individual (default), business, NGO — with KYB upgrade flow for business/NGO when needed.
- Login, password reset (phone-OTP primary, email-link backup), and phone-number-change flow with cooldown protection.

### Creator Dashboard

- Home overview: donation totals, page views, top-performing link, recent donations feed, share button.
- Links manager: add, edit, delete, drag-to-reorder, toggle on/off, auto-detect platform and icon from URL.
- Donations settings: toggle on/off, suggested amount chips, custom donation message, payout MoMo number with verification, full transaction history with CSV export.
- Appearance: theme presets and basic customization on free tier, advanced custom themes and fonts on Pro.
- Analytics: page views, link click counts, donation conversion rate, top referrers — 7-day history free, full history on Pro.
- Settings: username change with cooldown, profile info, notification preferences, account deletion.

### Public Profile Page

- Mobile-first vertical link stack with creator avatar, display name, and bio.
- Pinned donate button (top or bottom) when donations are enabled.
- Platform-specific link rendering with icons (Instagram, YouTube, TikTok, WhatsApp click-to-chat, Spotify, X, custom URLs).
- Click tracking for analytics, fast load on 3G connections.

### Donation Flow

- Dedicated donation page at sub-tree.com/username/donate showing creator identity, amount input with suggested chips, phone input with auto-detect of network (MTN/Airtel by prefix), optional message field.
- STK push integration with MTN MoMo Collections API and Airtel Money Collections API for Uganda, with architecture ready for Kenya (M-Pesa), Tanzania, and Rwanda.
- Direct-to-creator settlement (donation lands in creator's registered MoMo number, platform fee split off via API).
- Async webhook handling for payment confirmation, with retry logic and idempotency.
- Real-time status updates on the donation page ("check your phone" → success/failure).

### Pro Tier

- Unlimited custom themes, colors, and fonts.
- "Powered by Sub-tree" footer removal.
- Full analytics history with geographic and referrer breakdowns.
- Verified badge eligibility.
- Lower donation fee (e.g., 3% vs 5% on free tier).
- Paid in mobile money — eats our own dog food.

## Scope

### In Scope

- Web-based and mobile-web responsive product (single Next.js codebase, no native app).
- Creator portal with full link management, donation settings, and analytics.
- Public profile pages with link rendering and donation flow.
- MTN MoMo Collections and Airtel Money Collections integration for Uganda.
- Africa's Talking SMS for OTP and donation notifications.
- Reserved username admin review queue.
- Pro subscription tier with mobile money billing.
- Basic theme customization, analytics, and fraud rails (rate limits, suspicious amount flags).

### Out of Scope

- Native iOS or Android apps (Phase 2+).
- Card payments via Stripe or similar (not relevant to core market at launch).
- USSD donation flow for feature phones (Phase 2+).
- Multi-country MoMo support beyond Uganda at MVP (Kenya M-Pesa, Tanzania, Rwanda come later).
- Custom domains (yourname.com → Sub-tree page) — Phase 2.
- E-commerce features (selling products, digital downloads) — separate product, not link-tree scope.
- Creator-to-creator messaging, social features, or feed.
- Embedded video/music players beyond basic link previews.
- Cryptocurrency or stablecoin payments.
- Integration with the broader Muhamad ecosystem (KYC layer, EFRIS aggregator) at MVP — design for it, don't build it yet.

## Success Criteria

1. A new creator can sign up, verify their phone, add at least three links, enable donations, and have a live public page within 2 minutes of first visit.
2. A visitor can open a creator's public page, tap donate, complete an STK push payment, and have the funds land in the creator's MoMo account within 60 seconds of PIN entry — with the creator receiving an SMS confirmation.
3. The signup-to-first-donation funnel works end-to-end in production with at least 100 real creator accounts and 50 successful donations during a 30-day beta period.
4. Username uniqueness, reserved-name enforcement, and rate limiting all hold under adversarial testing (no duplicate handles, no profanity, no signup spam from a single IP).
5. The dashboard loads in under 2 seconds on a mid-range Android phone over 3G, and the public profile page loads in under 1 second on the same conditions.
6. Donation failures (network drop, insufficient funds, wrong PIN) are handled gracefully — the visitor sees clear status, the creator never sees a phantom donation, and idempotency prevents duplicate charges.