# Feature 55 — Fan Discovery

## Status
Proposed

## Context Links
- `docs/v3/features/43-fan-accounts.md`
- `docs/v3/features/45-fan-feed.md`

## What it adds
Ways for fans to discover new creators beyond links they've tapped:
- Search by creator name or handle
- Browse by category (Music, Art, Tech, Fashion, NGO, etc.)
- "Trending" — creators with most follower growth this week
- "Creators similar to [X]" — seeded by follow graph overlap

All powered by simple Postgres queries at launch. No ML recommendation engine
at v3 — just category filtering + growth metrics + follow graph.

## UI
Dashboard → Discover tab (added to nav when Feature 55 ships):
- Search bar at top
- Category filter chips (Music, Art, Tech, Fashion, Sport, NGO, Other)
- Trending section: top 10 by weekly follower growth
- "Fans like you also follow" section (follow graph overlap)

## Success Criteria
1. Fan can search for a creator by name and find them
2. Category filter returns relevant creators
3. Trending list updates daily
