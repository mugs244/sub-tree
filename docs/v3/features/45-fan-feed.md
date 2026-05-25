# Feature 45 — Fan Feed

## Status
Proposed

## Context Links
- `docs/v3/features/43-fan-accounts.md` — Follow system (dependency)
- `docs/v3/features/61-creator-posts.md` — posts that populate the feed
- `docs/v3/V3-ARCHITECTURE.md` — FeedEvent table

## Why
The feed is the reason fans come back. Without it, a fan's only reason to open
Sub-tree is to donate. With it, Sub-tree becomes part of their daily habit —
they check what creators they follow have posted, shared, or launched.

## What appears in the feed
- Creator posts (text, image, link cards) — from Feature 61
- Fundraiser launches and milestone updates — from v2 Feature 38
- New products added to shop — from v2 Feature 39
- Donation milestones ("Creator X just received their 100th donation")
- New links added to creator's page

## Feed rendering
- Chronological (newest first) from all followed creators
- Paginated with cursor-based pagination (20 events per page)
- Pull-to-refresh on mobile
- Post cards inline: text truncated at 300 chars ("Read more"), image grid,
  link smart cards, like button
- Activity events (non-post): compact one-line format with creator avatar

## Caching strategy
- Feed is served server-side from the FeedEvent table
- At launch volume: direct DB query joining Follow → FeedEvent
- At scale: pull-based (fan loads creator's recent events at feed load time)
  rather than push-based fanout. Captured as technical debt.

## Success Criteria
1. Fan sees posts from followed creators within 30 seconds of publish
2. Feed loads in under 1 second on 3G (server-rendered, minimal JS)
3. Feed correctly excludes content from creators the fan doesn't follow
4. Activity events (fundraiser, product, milestone) appear alongside posts
