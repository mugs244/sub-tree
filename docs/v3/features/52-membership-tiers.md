# Feature 52 — Fan Membership Tiers

## Status
Proposed — depends on Feature 51.

## Context Links
- `docs/v3/features/51-subscriptions.md` — dependency

## What it adds
Creator can define multiple subscription tiers (e.g., Bronze UGX 5k/mo,
Silver UGX 15k/mo, Gold UGX 30k/mo). Each tier has a name, price, and perk list.

When a fan subscribes, they choose a tier. The tier determines their monthly
amount and their access level (higher tiers can see content targeted to them
via a future `minimum_tier` field on Post).

At v3 launch, all tiers give the same content access (SUBSCRIBERS_ONLY unlocks
all subscriber content regardless of tier). Tier-specific content is a v4 addition.

## Creator flow
1. Dashboard → Subscriptions → Manage tiers
2. Create tier: name, price (UGX), description, perks (list of strings)
3. Toggle tier active/inactive
4. Reorder tiers (position field)
5. Fans see the tiers on the creator's public profile in a pricing card

## Success Criteria
1. Creator can create 3 tiers with different prices
2. Fan sees tier options on the creator's profile and can subscribe to any
3. All subscribers (regardless of tier) see SUBSCRIBERS_ONLY content
