# 42 — Smart Link Types

## Status

Proposed

## Date

2026-05-21

## Context Links

- `docs/PROJECT-OVERVIEW.md` — features list, free for all tiers
- `docs/ARCHITECTURE.md` — Invariant 12 (public profile pages render under 1 second on 3G)
- `docs/v2/V2-ARCHITECTURE.md` — Invariants 2 (affiliate previews gated by approval) and 6 (smart link cards render server-side)
- `docs/features/09-links-manager.md` — link CRUD (shipped)
- `docs/features/10-public-profile.md` — public page rendering (shipped)
- `docs/v2/features/40-affiliate-network.md` — affiliate link type interaction

Read those first. This file documents what is new.

## Why

Today, every link on Sub-tree renders the same: title + URL + platform icon (which we already detect for 19 platforms). It's functional but plain.

Linktree, Beacons, and other competitors render rich cards for common URL types: Spotify tracks show cover art, YouTube videos show thumbnails, Instagram posts preview content, tickets show event details. This makes profiles feel more alive and increases click-through.

Smart link types add this rendering. It's free for all tiers — it benefits the platform broadly and isn't a tier differentiator. The work is focused on rendering, not on payment or commerce.

This feature also provides the foundation for the affiliate link rich rendering (Feature 40) and for future ticket integrations.

## User Flow

### Creator adds a smart link

1. Creator in Links Manager taps "Add link"
2. Pastes a URL (e.g., a Spotify track URL)
3. Sub-tree fetches Open Graph metadata from that URL server-side
4. Detects platform from URL pattern (Spotify, YouTube, etc.)
5. Renders a preview of how the link will appear: image, title, description, platform-specific layout
6. Creator can edit the title if they want (defaults to fetched title)
7. Creator can choose render style: "Plain link" or "Rich card" (defaults to Rich card if metadata available)
8. Saves to their link list

### Visitor sees a smart link on a creator's profile

1. Server renders the link with the cached OG metadata
2. For supported platforms, renders the platform-specific layout (e.g., Spotify shows cover art + track info)
3. For unsupported platforms, renders a generic Open Graph card (image + title + description)
4. For pure URL links (no metadata), falls back to current behavior (icon + title)
5. Click goes directly to the source URL — Sub-tree records the click and redirects

### Affiliate link rendering (interaction with Feature 40)

1. If the link is an affiliate URL (`link_type = AFFILIATE`):
2. Server checks: is the link's owner an approved affiliate for this product?
3. If yes: renders the rich product card (price, image, "Buy")
4. If no: renders as a plain link with title only (per Invariant 2)

### Ticket link rendering

1. Creator pastes a URL from a supported ticketing platform (Quicket, Mookh, Tika, Eventbrite)
2. Sub-tree fetches event metadata (title, date, venue, image, price range) via Open Graph
3. Renders a ticket card: event image, title, date, venue, "Get tickets" CTA
4. Click goes to the original platform — Sub-tree does NOT issue or manage tickets
5. Sub-tree may earn a referral commission via Pesapal payment processing IF the ticketing platform routes payment through us — out of scope for v2 (deferred to v3)

## What Changes

### New behavior
- New link type system: links are categorized as `URL`, `SMART_CARD`, `AFFILIATE`, or `FUNDRAISER`
- Open Graph metadata fetching server-side via `open-graph-scraper` package
- 7-day cache of OG metadata per link (24 hours for ticket/event links)
- Platform-specific render templates: Spotify, YouTube, TikTok, Instagram, Twitter/X, ticket platforms, podcast feeds, generic OG fallback
- Refresh button on each link in dashboard to manually re-fetch metadata
- "Render as plain link" toggle per link (overrides smart rendering)

### Modified behavior
- `Link` table gains `link_type` enum + `smart_card_meta` JSON column
- Public profile renders links based on `link_type`
- Link click tracking already exists (Feature 09) — no changes needed

### Unchanged
- Free-tier-and-above availability (smart cards are NOT a Pro feature)
- Click tracking, drag-to-reorder, enable/disable toggles
- Existing platform icon detection (already in `lib/utils/platform.ts`) — that's a separate, lighter mechanism that still works

## Data Model Changes

Add to `Link` model:

```prisma
model Link {
  // existing fields preserved...

  link_type             LinkType  @default(URL)
  smart_card_meta       Json?     // cached OG data
  smart_card_fetched_at DateTime? // when metadata was last fetched
  render_as_plain       Boolean   @default(false) // creator override
}

enum LinkType {
  URL         // simple URL link (current default)
  SMART_CARD  // rich Open Graph card
  AFFILIATE   // affiliate link (Feature 40)
  FUNDRAISER  // fundraiser CTA (Feature 38)
}
```

`smart_card_meta` JSON shape (typed via Zod for safety):

```typescript
type SmartCardMeta = {
  platform: "spotify" | "youtube" | "tiktok" | "instagram" | "twitter" | "ticket" | "podcast" | "generic"
  title: string
  description: string | null
  image_url: string | null
  // Platform-specific fields:
  spotify?: { track_name: string, artist: string, album_art: string }
  youtube?: { video_id: string, thumbnail: string, duration: string | null }
  ticket?: { event_name: string, date: string | null, venue: string | null, price_range: string | null }
  // ... etc per platform
}
```

Migration: `feature_42_smart_link_types`

## API Surface

```
POST   /api/links                           — existing — extended to accept link_type and trigger OG fetch
POST   /api/links/[id]/refresh-metadata     — refresh cached OG data for a link
PATCH  /api/links/[id]                      — existing — supports updating link_type and render_as_plain
GET    /api/og/preview?url=[url]            — server-side OG preview for the link creation UI (no DB write)
```

OG fetching helper (not an API surface, but a service):

```
lib/services/smart-links.ts

detectPlatform(url): platform key
fetchOpenGraph(url): SmartCardMeta
shouldRenderRich(link, viewerContext): boolean  // implements Invariants 2 and 6
```

## Platform Detection

URL pattern matching (server-side, no API calls needed for detection):

- `open.spotify.com/track/*` → Spotify
- `youtube.com/watch?v=*` or `youtu.be/*` → YouTube
- `tiktok.com/@*/video/*` → TikTok
- `instagram.com/p/*` or `instagram.com/reel/*` → Instagram
- `twitter.com/*/status/*` or `x.com/*/status/*` → Twitter
- `quicket.co.ug/events/*`, `mookh.com/event/*`, `tika.app/event/*`, `eventbrite.com/e/*` → Ticket
- `open.spotify.com/episode/*`, anchor.fm patterns, RSS feed detection → Podcast
- Anything else with valid OG metadata → Generic
- No OG metadata available → Plain URL fallback

## Caching Strategy

- OG fetch happens on link creation, on manual refresh, and as a fallback when `smart_card_fetched_at` is null or stale
- Cache TTL:
  - Tickets/events: 24 hours (prices/availability change)
  - Music/video: 7 days (rarely changes)
  - Social posts: 7 days
  - Generic: 7 days
- Stale-while-revalidate: if metadata is past TTL but exists, render it AND queue a background refresh
- If OG fetch fails, fall back to plain URL render — never block the page

## UI Changes

### Dashboard — Links Manager
- "Add Link" flow: paste URL → fetching... → preview card shown → save
- Each link card in the manager shows the current render preview
- Per-link options menu: "Refresh preview", "Render as plain link", "Edit title", "Delete"
- If OG fetch failed, show "Could not fetch preview" with a retry button

### Public profile — rendered links
- Spotify track: cover art, track name, artist, "Play on Spotify" CTA
- YouTube video: thumbnail with play overlay, title, duration
- TikTok: video thumbnail, creator handle, title (TikTok's OG is limited — keep this simple)
- Instagram: post thumbnail, caption preview
- Twitter/X: quote card with text, author, timestamp
- Ticket: event image, name, date, venue, "Get tickets" CTA
- Podcast: cover art, episode title, show name, play CTA
- Generic OG: image, title, description, source domain
- Plain fallback: existing behavior (icon + title)

All rendered links: click goes through Sub-tree's tracking redirect first (`POST /api/links/[id]/click` then redirect to URL) — already shipped in Feature 09.

## Scope

### In scope
- Link type categorization (URL, SMART_CARD, AFFILIATE, FUNDRAISER)
- Server-side OG fetching via `open-graph-scraper`
- 7-day cache with per-platform TTL
- Platform-specific renders for ~8 platforms
- Generic OG fallback for any URL with metadata
- Plain URL fallback for URLs without metadata
- Creator override (render as plain link)
- Manual refresh button per link
- Stale-while-revalidate caching

### Out of scope
- Embedded media playback (Spotify player, YouTube embed) — link out only at v2
- Real-time OG metadata updates (e.g., live ticket sold-out badge) — requires more complex caching
- Client-side OG fetching — forbidden per Invariant 6
- Custom card templates per creator (theming applies via Feature 37, but layouts are fixed)
- A/B testing of link render styles
- Open Graph fetching for OAuth-required sources (Instagram private, etc.)

## Success Criteria

1. A creator pastes a Spotify track URL and sees a rich preview with cover art and track info on their public page within 5 seconds
2. A creator pastes a Quicket event URL and the link renders as a ticket card with event date and venue
3. A creator can toggle "Render as plain link" and the link falls back to the icon+title rendering
4. OG fetch failures don't break the page — they fall back to plain rendering automatically
5. Cached metadata is reused on subsequent page loads (no OG fetch on every page render)
6. Public profile page still loads in under 1 second on 3G (Invariant 12 holds)
7. Affiliate links (Feature 40) render rich cards only on approved affiliates' pages (Invariant 2)

## New Invariants

Honors v2 Invariants 2 and 6.

Service-level rules:
- All OG fetching happens server-side. Never via client.
- OG fetch has a strict timeout (3 seconds). If exceeded, fall back to plain render and queue background refresh.
- Cached metadata is reused until TTL expires.
- Link click tracking happens regardless of render type (rich or plain).
- Affiliate link rich rendering checks the approved affiliate relationship server-side on every render — never cached at the rendering layer.

## Open Questions

- Should we render YouTube videos as embedded players or thumbnail-with-link-out? Recommend link-out at v2 (embed adds JS weight); revisit when 3G performance budget allows.
- Ticket platforms beyond Quicket/Mookh/Tika/Eventbrite: which to support? Recommend start with these four (most relevant for EA market), expand by request.
- Should the preview card image be auto-fetched and stored in our Vercel Blob, or hot-linked from the source? Recommend hot-link with `<img src>` (cheap, simple) — risk is source removes the image. Acceptable risk at v2.
- Spotify and YouTube have rich oEmbed APIs beyond OG. Use OG only for v2, oEmbed later for richer data if needed.

## Migration Plan

Net new feature. Existing links default to `link_type = URL`, `smart_card_meta = null`. They render exactly as they do today.

When a creator edits an existing link in the dashboard, they get the option to "Enhance this link" which triggers an OG fetch and updates `link_type` to `SMART_CARD` if metadata is found.

No breaking changes for existing creators.
