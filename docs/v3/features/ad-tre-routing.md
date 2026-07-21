# Ad-tre — Intelligent Routing Engine (Design)

Status: **In progress (v1 in-house core)** · Depends on: Business Tier / Ad Slots

This is the "more in-depth routing analysis to be provided later" the Business
Tier spec deferred. It turns the vague brief into concrete, buildable decisions.

## Goal

Decide **which ad (if any) to show a given device right now**, such that viewers
are never flooded and booked demand is spread across each booking's window.

Ad-tre is the *decide* side. `AdImpression` + `recordAdImpression` are the
*record* side (what was actually shown, which Analytics reads). This design adds
the decision layer that reads impressions back to make choices — closing the loop.

## Scope decision (v1)

- **In-house.** The Revive/Mux/fragmentation stack is aspirational — nothing is
  set up. v1 is a self-contained TypeScript service. The interface is drawn so a
  Revive-backed implementation can replace it later without callers changing.
- **v1 builds the anti-flood core**: live-booking selection + per-device
  frequency cap + pacing + fair rotation. This is the mechanism that actually
  keeps viewers from being flooded, and it's fully buildable today.
- **v2 (documented, not built)**: global capacity planning from live-user counts
  and cross-booking overflow deferral. These need a product-defined capacity
  formula and a real presence signal (see Open Questions) — deferred rather than
  faked.

## The integration seam

```ts
interface AdRouter {
  selectAdForDevice(ctx: AdRequestContext): Promise<AdDecision>
}
```

- `AdRequestContext` = `{ deviceId, viewerUserId?, now }`.
- `AdDecision` = the chosen booking + creative to render, **or** a no-ad decision
  with a machine-readable reason (`no_inventory | frequency_capped | paced`).
- The in-house `inHouseAdRouter` implements this. A future `reviveAdRouter` would
  implement the same interface by delegating to Revive's serving/VAST endpoints.
- **Mux** is opaque to the router: `AdCreative.media_url` is treated as a
  playback reference; the router never touches video hosting.

## Device identity

The spec says exposure is tracked **per device**, but the schema only had
`viewer_user_id` (logged-in users only). v1 adds a **`device_id`** to
`AdImpression`:

- The client (future feed) generates a stable opaque token, stored in a
  first-party cookie, and sends it on every ad request and impression report.
- `device_id` is the frequency-cap key. `viewer_user_id` is still captured when
  present (for Analytics demographics), but capping is device-scoped so it works
  for anonymous viewers too.
- Nullable for backward compatibility with impressions recorded before this.

## Serving flow

1. Feed calls `GET /api/ads/next?deviceId=…` → `selectAdForDevice`.
2. Router returns a creative to render, or a no-ad decision.
3. When the feed actually renders the ad, it reports the impression
   (`recordAdImpression`, now carrying `device_id`). Recording on *render*, not
   *selection*, keeps counts honest — a selected-but-never-seen ad shouldn't
   count against the viewer's cap.

## Decision rules (v1)

Evaluated in order for a request; all thresholds are `PlatformSetting`-backed so
they can be tuned without a deploy:

1. **Live inventory** — candidate bookings are `PUBLISHED` with
   `starts_at ≤ now ≤ ends_at`. None → `no_inventory`.
2. **Global per-device frequency cap** — count this device's impressions across
   *all* ads within a rolling window `ad_route_freq_window_min` (default 60). If
   `≥ ad_route_freq_cap` (default 5), stop → `frequency_capped`. This is the core
   "never flood" rule: a device sees at most N ads per hour regardless of how
   much inventory is live.
3. **Pacing** — if the device's most recent impression is newer than
   `ad_route_min_spacing_sec` (default 120), stop → `paced`. Enforces minimum
   content between ads.
4. **Per-booking cooldown** — exclude candidates this device saw within
   `ad_route_booking_cooldown_min` (default 30), so the same ad doesn't repeat
   back-to-back while other inventory exists.
5. **Fair rotation** — among the survivors, pick the one this device has seen
   **least recently** (never-seen first). Spreads exposure across advertisers and
   naturally paces each booking across its window without a global scheduler.

## Config (PlatformSetting keys)

| Key | Default | Meaning |
|---|---|---|
| `ad_route_freq_cap` | 5 | Max ads per device per window |
| `ad_route_freq_window_min` | 60 | Frequency-cap window (minutes) |
| `ad_route_min_spacing_sec` | 120 | Min seconds between ads for a device |
| `ad_route_booking_cooldown_min` | 30 | Min minutes before the same booking repeats to a device |

## Deferred to v2 (needs product input)

- **Live-user / capacity model.** "Calculate live users, break slots into how
  many ads each device can take." Needs a real presence signal — `last_active_at`
  today only updates on authenticated dashboard visits, not the feed — and a
  product-defined formula for slots-per-device. Not faked here.
- **Cross-booking overflow deferral.** "Overflow defers to next day/week/month."
  Requires per-booking impression *targets* (not currently sold — bookings are
  time-window based, not impression-count based) to know what "overflow" means.
- **Revive/Mux integration.** Swap `inHouseAdRouter` for a Revive-backed
  implementation; treat Mux playback ids in `media_url`.

## Slot inventory model (decided)

Slots are **finite shared positions ("share of voice")**, not a wall-clock
monopoly. Each window holds up to `ad_slot_window_capacity` concurrent slots
(default 10, `PlatformSetting`-backed). Buying a slot exclusively reserves one
of those positions — nobody else can take *your* slot — and when the window's
positions are all sold it reads as fully booked (`WINDOW_FULL`). Ad-tre then
rations exposure among the live slots per device, so many advertisers can be
live at once without viewers being flooded. This is what makes the router's
rotation and per-device capping meaningful; a time-monopoly model would leave
only one ad live and reduce Ad-tre to a pacer.

`ad_slot_window_capacity` (platform-wide sellable concurrency) is deliberately
separate from `ad_route_freq_cap` (how many ads one device sees): you can sell
10 concurrent slots while each device only sees 5/hour — the router spreads the
10 across devices and time.

## Open questions

- **Impression targets vs. time windows.** Slots are sold by time window today.
  True cross-booking overflow deferral ("defer surplus to next day/week/month")
  would need per-booking impression *targets* to define what "surplus" is.
- What is the real **presence signal** for "live users" — feed heartbeats, a
  presence ping, or derived from recent impressions? Needed to make
  `ad_slot_window_capacity` a computed function of live audience rather than a
  flat config.
- Frequency-cap and window-capacity defaults are placeholders pending real
  audience data.
