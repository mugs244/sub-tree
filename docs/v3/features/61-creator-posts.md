# Feature 61 — Creator Posts

## Status
Proposed

## Date
2026-05-25

## Context Links
- `docs/v3/features/43-fan-accounts.md` — fan accounts + follow system
- `docs/v3/features/45-fan-feed.md` — posts populate the feed
- `docs/v2/features/42-smart-link-types.md` — link post smart card rendering
- `docs/ARCHITECTURE.md` — Vercel Blob for images

## Why
The fan feed needs content to be useful. Without creator posts, the feed is just
activity events. With posts, creators share updates, behind-the-scenes, new music,
announcements, and exclusive content for subscribers. It's also what makes the
fan-creator relationship feel real beyond transactions.

## Post Types
Three types, freely combined in one post:

1. **Text** — up to 5,000 characters, markdown-lite (bold, italic, line breaks)
2. **Images** — up to 4 images per post, each max 1MB (client-side compressed),
   stored in Vercel Blob, optional captions
3. **Link card** — paste a URL, renders as a smart card via Feature 42 logic
   (YouTube thumbnail, Spotify track, event card, generic OG)

## Visibility
Per post, creator selects:
- **Public** — all followers see it in feed + on creator's public Posts tab
- **Supporters only** — fans who have donated at least once to this creator
- **Subscribers only** — fans with an active Subscription to this creator

Visibility gating is server-side on every render (v3 Invariant 4).
Locked posts show blurred preview with "Support/Subscribe to unlock" CTA.

## User Flow

### Creator publishes
1. Dashboard → Posts → New Post
2. Types text, adds images (file picker, drag-drop), pastes URL for smart card
3. Selects visibility
4. Publishes → appears in followers' feeds immediately
5. FeedEvent record created (type: POST_PUBLISHED) for feed fanout

### Fan sees post
1. Feed tab: post card with creator avatar, timestamp, visibility badge
2. Text truncated at 300 chars ("Read more" expands)
3. Image grid (1, 2, or 3-column based on count)
4. Link smart card below caption
5. Like button (heart), count
6. Locked post: blurred with unlock CTA

### Creator manages posts
- Dashboard → Posts tab: list with visibility, like count, view count
- Edit: text and visibility can change
- Delete: soft delete (deleted_at set, hidden from all UI)
- Pin: one post pinned to top of public Posts tab at a time

## Data Model
See `docs/v3/V3-ARCHITECTURE.md` — Post, PostImage, PostLink, PostLike,
PostVisibility tables.

## API Surface
```
POST   /api/posts
GET    /api/posts                        Creator's posts dashboard list
PATCH  /api/posts/[id]
DELETE /api/posts/[id]                   Soft delete
POST   /api/posts/[id]/pin
POST   /api/posts/[id]/like
DELETE /api/posts/[id]/like
POST   /api/posts/upload-image           Vercel Blob signed upload URL
GET    /api/public/[handle]/posts        Public posts with visibility gating
GET    /api/fan/feed                     Feed including posts (Feature 45)
```

## UI Changes

### Creator dashboard — Posts tab
- Composer: text area, image upload (max 4, compress before upload),
  URL paste, visibility selector, Publish button
- Image preview grid in composer
- Smart card preview when URL pasted
- Post list: text preview, image thumbnails, visibility badge, like/view counts

### Creator public profile — Posts tab (new tab alongside links)
- Pinned post at top
- Chronological post list
- Locked posts: blurred content + "Support to unlock" CTA

### Fan feed
- Post card: creator avatar + handle + timestamp
- Text, images (swipeable), link smart card
- Like button (heart) with count
- Locked post: blurred + upgrade CTA

## Scope

### In scope
- Text + image + link posts
- Three visibility tiers
- Like button (total count only, not who liked)
- Pin one post per creator
- Soft delete
- Feed integration via FeedEvent
- Vercel Blob for images (max 4 per post, max 1MB each compressed)
- Smart card via Feature 42 logic

### Out of scope
- Comments (too much moderation surface for v3)
- Post sharing/reposting between creators
- Scheduled posts
- Video hosting (link to YouTube via smart card only)
- Post analytics beyond view/like counts
- Draft posts

## New Invariants
- Posts are never hard-deleted (v3 Invariant 3)
- Visibility gating is always server-side (v3 Invariant 4)
- like_count is denormalized (same pattern as raised_amount on Fundraiser)
- Image compression client-side before upload (v3 Invariant 8)

## Success Criteria
1. Creator publishes text + image post, appears in followers' feeds within 30s
2. Creator pastes YouTube URL, smart card renders in composer
3. SUBSCRIBERS_ONLY post shows blurred preview with upgrade CTA to non-subscriber
4. Fan can like a post, count increments
5. Deleting a post removes it from feed immediately
6. Public profile page still loads under 1s on 3G (Invariant 12 from v1)
