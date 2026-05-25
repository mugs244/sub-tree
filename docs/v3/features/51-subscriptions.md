# Feature 51 — Subscription Content

## Status
Proposed — BLOCKED until Pesapal confirms recurring billing support.

## Context Links
- `docs/v3/features/43-fan-accounts.md` — fan accounts
- `docs/v3/features/52-membership-tiers.md` — builds on this
- `docs/features/36-payment-aggregators.md` — Pesapal integration
- `docs/v3/V3-ARCHITECTURE.md` — Subscription, SubscriptionPayment tables

## Why
Subscriptions give creators a recurring revenue stream beyond one-time donations.
Fans who love a creator pay a monthly amount and get access to subscriber-only
content (SUBSCRIBERS_ONLY visibility posts from Feature 61).

This is Patreon's core mechanic, adapted for MoMo-first EA market.

## ⚠️ Pesapal Gate
Before building: confirm with Pesapal whether they support automatic monthly
re-charge on a stored MoMo number. If YES, renewals are automated.
If NO, fans receive a renewal reminder and must approve a new MoMo STK push
each month (more friction, but compliant). Build whichever path Pesapal supports.

## User Flow

### Fan subscribes
1. Fan visits creator's public profile
2. Taps "Subscribe" (or a specific tier from Feature 52)
3. Sees what they unlock: subscriber-only posts preview (blurred)
4. Enters MoMo number, confirms amount
5. Pesapal STK push — PIN approval
6. Subscription created, SUBSCRIBERS_ONLY content unlocks immediately
7. Fee taken: platform fee (from PlatformSetting) deducted, creator gets remainder

### Monthly renewal
- Automated (Pesapal) OR manual reminder (Africa's Talking SMS 3 days before renewal)
- On successful renewal: SubscriptionPayment record created, period extended
- On failed renewal: 3-day grace period, then PAST_DUE, 7-day retry, then EXPIRED
- On expiry: SUBSCRIBERS_ONLY content re-locks

### Fan cancels
1. Fan goes to Orders tab → Subscriptions section
2. Taps subscription → "Cancel" button
3. Subscription stays ACTIVE until end of paid period, then CANCELLED

## Subscription Fee Model
- Default: flat 5% platform fee on every renewal
- Progressive mode (admin toggle): 7% under 100 subscribers → 4% over 100
- All rates configurable from admin dashboard (Feature 63)
- Fee rate locked at time of EACH PAYMENT (not at subscription creation)
- Fee changes apply to future renewals, never to past ones

## Data Model
See `docs/v3/V3-ARCHITECTURE.md` — Subscription, SubscriptionPayment,
SubscriptionStatus tables.

## API Surface
```
GET    /api/subscriptions/tiers/[handle]   Fan views creator's subscription options
POST   /api/subscriptions                  Fan subscribes
DELETE /api/subscriptions/[id]             Fan cancels
GET    /api/fan/subscriptions              Fan's active subscriptions list
GET    /api/creator/subscriptions          Creator views their subscribers
POST   /api/cron/subscription-renewals     Daily cron — process due renewals
```

## Payments & Orders integration
Subscriptions appear in the fan's Orders tab with:
- Subscription name, creator, monthly amount
- Status (Active / Cancelled / Past Due / Expired)
- Next renewal date
- "Cancel" button
- Payment history (every month's SubscriptionPayment)

## Success Criteria
1. Fan subscribes, STK push completes, SUBSCRIBERS_ONLY posts unlock immediately
2. Subscription appears in fan's Orders tab with correct renewal date
3. Monthly renewal processes correctly (automated or manual per Pesapal capability)
4. Cancellation sets status to CANCELLED and content re-locks after period end
5. Platform fee deducted at correct rate from PlatformSetting
