# Feature 62 — Chat System (Creator-Initiated DMs)

## Status
Proposed

## Date
2026-05-25

## Context Links
- `docs/v3/features/43-fan-accounts.md` — fan accounts (dependency)
- `docs/ARCHITECTURE.md` — PII handling, append-only records
- `docs/v3/V3-ARCHITECTURE.md` — Conversation, Message tables

## Why
Creators need to communicate with their audience beyond public posts.
A musician wants to personally thank top donors. An NGO wants to update
major supporters on campaign progress.

Creator-initiated only prevents spam and keeps creators in control of their
attention. The filter system lets creators quickly find the right audience.

## How "Creator Chooses" Works
Creator opens the message composer and sees an audience filter before writing:

- **Mutuals** — fans who follow the creator AND creator follows back
- **Top supporters** — fans who donated the most (by total UGX, all time)
- **Recent supporters** — fans who donated in the last 30 days
- **Subscribers** — fans with active Subscription to this creator
- **All followers** — any fan who follows the creator
- **Search by handle** — find a specific fan directly

Creator selects up to 10 recipients, writes message (text + optional 1 image),
sends. Each recipient gets their own Conversation + Message — not group chat.

## Architecture
**Polling-based at v3 launch** (not real-time). Fan inbox polls every 30 seconds
when open. Real-time upgrade path: Liveblocks (already in pending-dependencies.md)
when volume justifies it.

## User Flow

### Creator sends
1. Dashboard → Messages → New Message
2. Selects filter → scrollable fan list → select up to 10
3. Types message (max 2,000 chars), optional image
4. Sends → one Conversation + Message per recipient
5. Fan receives in-app notification + optional Africa's Talking SMS

### Fan receives and replies
1. Fan's Messages tab → conversation from creator
2. Reads message
3. Replies (full back-and-forth thread supported)
4. Creator sees reply in their conversation thread

### Creator manages inbox
- Filter by: unread, recent, by handle
- Archive a conversation (hides, not deleted)
- Cannot delete a fan's message (admin only)

## Data Model
See `docs/v3/V3-ARCHITECTURE.md` — Conversation, Message tables.

## API Surface
```
# Creator side
POST   /api/messages/new
GET    /api/messages/conversations
GET    /api/messages/conversations/[id]
POST   /api/messages/conversations/[id]
PATCH  /api/messages/conversations/[id]/archive
GET    /api/messages/audience/mutuals
GET    /api/messages/audience/top-supporters
GET    /api/messages/audience/recent
GET    /api/messages/audience/subscribers
GET    /api/messages/audience/followers
POST   /api/messages/upload-image

# Fan side
GET    /api/fan/messages
GET    /api/fan/messages/[id]
POST   /api/fan/messages/[id]
PATCH  /api/fan/messages/[id]/read
```

## Fan portal UI
- Messages tab: inbox from creators, unread dot, reply box
- "Only creators can start conversations" note — no New Message button for fans
- Polling: 30-second poll when inbox is open

## Scope

### In scope
- Creator-initiated DMs
- Audience filters (mutuals, top supporters, recent, subscribers, all followers, search)
- Bulk send to up to 10 fans (separate conversations per fan, not group)
- Text (max 2,000 chars) + one image attachment
- Fan can reply (full thread)
- 30-second polling
- In-app notification (unread dot)
- Africa's Talking SMS to fan on first message
- Archive by creator
- Rate limit: max 50 new conversations per creator per day

### Out of scope
- Fan-initiated messages (never — creator-initiated only per v3 Invariant 5)
- Group chat
- Real-time typing indicators
- Voice/video messages
- Read receipts shown to sender
- Message reactions
- Creator-to-creator DMs

## New Invariants
- Chat is creator-initiated only (v3 Invariant 5)
- Messages are never hard-deleted (soft delete by admin only)
- Audience filter queries are ownership-checked server-side
- One conversation per creator-fan pair (@@unique constraint)

## Success Criteria
1. Creator filters by "Top Supporters," selects 3 fans, sends — each receives
   within 60 seconds
2. Fan opens inbox, reads, replies within 3 taps
3. Creator sees reply on next poll (within 30 seconds)
4. Fan with SMS notifications enabled receives Africa's Talking SMS
5. Fan cannot initiate a conversation — no "New Message" button in fan inbox
6. Rate limit: creator blocked after 50 new conversations in a day
