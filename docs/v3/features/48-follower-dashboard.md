# Feature 48 — Creator Follower Dashboard

## Status
Proposed

## Context Links
- `docs/v3/features/43-fan-accounts.md` — Follow table

## What it adds
A "Followers" section in the creator dashboard:
- Total follower count (large number, at a glance)
- Follower growth chart (last 30 days)
- Recent followers list: handle, avatar, "Follows since" date
- Follower breakdown: how many are also donors, how many are subscribers

This is a small feature — the Follow table already exists after Feature 43.
This just adds the dashboard UI to surface the data.

## Success Criteria
1. Creator sees their follower count on the dashboard home
2. Creator can see which recent followers have also donated
3. Follower count increments in near-real-time when a fan follows
