# Feature 43 — Fan Accounts & Two-Sided Platform Structure

## Status
Proposed

## Date
2026-05-25

## Context Links
- `docs/PROJECT-OVERVIEW.md` — core user flow (will need updating when this ships)
- `docs/ARCHITECTURE.md` — auth model, Clerk, User table
- `docs/v2/V2-OVERVIEW.md` — tier model (this revises the default account type)
- `docs/features/03-clerk-auth.md` — existing auth foundation
- `docs/features/04-username-onboarding.md` — handle claim flow
- `docs/v3/V3-ARCHITECTURE.md` — FanProfile, Follow, all new tables

## Why

Currently Sub-tree is creator-first. Every signup is assumed to be a creator.
Most people who encounter Sub-tree will be fans first — they tapped a creator's
link in bio, they donated, they want to see more. Forcing a creator setup flow
before they can do anything fan-related is the wrong friction.

v3 flips the default: everyone starts as a fan. Fans can follow creators, track
support history, and discover new creators without needing a creator page.
"Become a creator" is always one tap away in the hamburger menu but never forced.

## What Changes

### New behavior
- Signup creates a Fan account (account_type = FAN) by default
- Onboarding: claim handle → fan profile (avatar, bio) → land in fan dashboard
- Fan dashboard: Feed, Following, Exclusive, Orders, Messages
- Hamburger menu has "Become a creator" at bottom
- "Become a creator" shows tier comparison: Basic (free), Pro, Business, Content House
- On upgrade: creator page provisioned on top of existing fan account
- Context switcher in nav: "Fan view" / "Creator view" for upgraded accounts

### Modified behavior
- Current v1 onboarding becomes the "Become a creator → Basic tier" upgrade path
- Existing v1/v2 creators: account_type stays INDIVIDUAL (Basic). FanProfile row
  created with defaults. They see the fan dashboard tab added on next login.
  Their creator page and handle are unchanged.
- `User.account_type` enum gains FAN as a new value. Existing users keep INDIVIDUAL.

### Unchanged
- All v1 creator features work identically
- All v2 tier features work identically
- Clerk auth unchanged
- Anonymous donations still work (fan account not required to donate)

## Data Model
See `docs/v3/V3-ARCHITECTURE.md` — FanProfile, Follow tables.

## API Surface
```
GET    /api/fan/profile
PATCH  /api/fan/profile
POST   /api/fan/follow/[handle]
DELETE /api/fan/follow/[handle]
GET    /api/fan/following
GET    /api/fan/support-history
POST   /api/fan/claim-donations      // link anonymous donations by phone
GET    /api/creator/tiers-info       // tier comparison for upgrade screen
POST   /api/creator/upgrade          // FAN → chosen creator tier
GET    /api/public/fans/[handle]     // public fan profile
GET    /api/creators/[handle]/followers
```

## Success Criteria
1. New user signs up, lands in fan dashboard without creator setup
2. Fan can follow a creator and see them in Following tab
3. Fan taps "Become a creator" → chooses Basic → immediately has creator page
4. Existing v1 creator sees fan dashboard added to their account on next login
5. Fan can claim past anonymous donations by phone number
6. Privacy settings work: private fan doesn't appear in public follower lists

## Migration
Existing v1/v2 creators: account_type stays INDIVIDUAL.
FanProfile row created per user with show_support_history = true,
show_following = true. Zero visual change to existing creator pages.

Existing donation records: fan can "claim" by matching Donation.buyer_phone
to their account phone via POST /api/fan/claim-donations.
