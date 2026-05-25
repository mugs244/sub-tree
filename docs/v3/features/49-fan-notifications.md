# Feature 49 — Fan Notifications

## Status
Proposed

## Context Links
- `docs/v3/features/45-fan-feed.md` — events that trigger notifications
- `docs/features/17-donation-notifications.md` — existing notification pattern

## What it adds
Push notifications to fans when:
- A creator they follow publishes a new post
- A creator they follow launches a fundraiser
- A creator they subscribe to posts subscriber-only content
- A creator messages them (Feature 62)

Notification channels:
- In-app: red dot on the bell icon in the header, notification panel on tap
- SMS (optional): Africa's Talking, fan controls in settings

Respects fan preferences: each notification type can be toggled on/off.

## Data Model
Reuses existing v1 notification patterns (DonationEvent, read_at).
New: `FanNotification` table (fan_id, type, resource_id, read_at, created_at).

## Success Criteria
1. Fan receives in-app notification when followed creator posts
2. Fan can disable specific notification types in settings
3. SMS notification delivered via Africa's Talking when fan opts in
