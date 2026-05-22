# 37 — Pro Themes & Extended Colors

## Status

Proposed

## Date

2026-05-21

## Context Links

- `docs/PROJECT-OVERVIEW.md` — Pro tier scope
- `docs/ARCHITECTURE.md` — Pro tier billing (v1 Feature 20, currently Proposed)
- `docs/UI_CONTEXT.md` — existing design tokens
- `docs/v2/V2-OVERVIEW.md` — Pro tier feature set
- `docs/features/11-appearance-free.md` — free-tier appearance baseline (shipped)

Read those first. This file documents what is new.

## Why

Free tier gives creators 5 theme presets and a button style picker (Feature 11, shipped). Pro creators need deeper customization to make their page feel like their brand — custom accent colors, background colors, button styling, font choice. This is the primary visual upgrade reason for Pro and the feature most creators will notice immediately after upgrading.

## User Flow

1. Creator upgrades to Pro (handled in v1 Feature 20)
2. Goes to Dashboard → Appearance
3. Sees expanded options unlocked: full color picker for accent, background, button colors
4. Sees additional theme presets (8 more on top of free tier's 5 = 13 total)
5. Sees font choices (4 options beyond default Geist Sans)
6. Sees button shape options (rounded, pill, square)
7. Sees "Hide Sub-tree branding" toggle
8. Changes preview live in the existing preview pane (already built in Feature 11)
9. Auto-save kicks in after 800ms (existing pattern)
10. Public profile page reflects changes immediately

## What Changes

### New behavior
- Full hex color picker for 6 color roles: page background, accent, button background, button text, card background, card text
- 8 additional theme presets on top of free tier's 5 (total 13)
- 4 font options: Geist Sans (default), Inter, Playfair Display, Space Grotesk
- "Remove Sub-tree branding" toggle (hides "Powered by Sub-tree" footer on public page)
- Custom button shape selector: rounded (default), pill, square — this exists at free tier as 3 presets; Pro lifts it into the full color customization

### Modified behavior
- `AppearanceForm` component gains a Pro-only section behind a feature flag (`profile.user.tier === "PRO" || "BUSINESS" || "CONTENT_HOUSE"`)
- Free tier UI shows Pro options as locked with an "Upgrade to Pro" nudge — does not hide them entirely
- Public profile page renderer reads new theme fields from the Profile record and applies them as CSS custom properties on the page wrapper

### Unchanged
- Free tier themes still work exactly as before
- Existing `theme_preset` and `button_style` fields keep their meaning
- Design tokens in `globals.css` are not touched — creator themes are scoped to their public page only, never to dashboard UI

## Data Model Changes

Add to `Profile` model:

```prisma
model Profile {
  // existing fields preserved...

  // Pro theme customization (nullable — falls back to preset)
  theme_bg_color      String?   // hex value
  theme_accent_color  String?   // hex value
  theme_button_color  String?   // hex value
  theme_button_text   String?   // hex value
  theme_card_bg       String?   // hex value
  theme_card_text     String?   // hex value
  theme_font          String?   // font key: "geist" | "inter" | "playfair" | "space-grotesk"
  hide_branding       Boolean   @default(false)
}
```

Migration: `npx prisma migrate dev --name feature_37_pro_themes`

## API Surface

The route exists already (Feature 11). Extend its Zod schema and tier-gate the new fields.

`POST /api/profile/appearance` — extend existing endpoint:

```ts
// New fields added to Zod schema — only accepted when caller tier is PRO+
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional()
const fontKey  = z.enum(["geist", "inter", "playfair", "space-grotesk"]).nullable().optional()

{
  // existing (all tiers)
  theme_preset?: string
  button_style?: string

  // Pro only — 403 if caller is FREE
  theme_bg_color?: string | null
  theme_accent_color?: string | null
  theme_button_color?: string | null
  theme_button_text?: string | null
  theme_card_bg?: string | null
  theme_card_text?: string | null
  theme_font?: string | null
  hide_branding?: boolean
}
```

Server checks `user.tier` after Clerk auth. Free tier callers sending any Pro-only field get a 403 — do not silently drop the fields.

## UI Changes

### Dashboard — Appearance tab
- Existing layout (controls left, preview right) preserved
- New "Custom theme" section below presets, with:
  - 6 color picker inputs (using shadcn color input pattern or HTML `<input type="color">`)
  - Font selector (radio cards, 4 options)
  - "Hide Sub-tree branding" toggle
- Free tier: Pro section visible but locked, with clear upgrade CTA inline
- Save indicator (existing pattern) reflects auto-save state

### Public profile page
- Reads theme fields from Profile record
- Applies as scoped CSS custom properties on the `<main>` wrapper:

```tsx
<main style={{
  "--page-bg": profile.theme_bg_color ?? THEME_VARS[profile.theme_preset].bg,
  "--page-accent": profile.theme_accent_color ?? THEME_VARS[profile.theme_preset].accent,
  // etc
} as React.CSSProperties}>
```

- Falls back to existing preset values if custom is null

## Scope

### In scope
- 6 color pickers for the 6 color roles
- 8 new theme presets (5 free + 8 Pro = 13 total)
- 4 font options
- Button shape selector (already shipped as button_style — keep as-is)
- Hide branding toggle
- Tier-gate enforcement at API level (don't trust client)
- Free tier sees Pro options as locked with upgrade nudge

### Out of scope
- Custom CSS input (too risky for v2 — XSS surface)
- Animated backgrounds, gradients beyond solid colors
- Per-link custom colors (global theme only at v2)
- Dark mode for the dashboard (separate feature, deferred)
- Custom font upload by creator (only curated list)
- Logo upload (will land in Vercel Blob avatar work first)

## New Invariants

This feature does not introduce v2-level invariants. It honors v2 Invariant 6 (smart link cards render server-side — themes ARE server-side here, no concern).

Service-level rules:
- Color values validated server-side: must be valid hex format `#[0-9a-fA-F]{6}` or null
- Font keys validated against a known whitelist
- `hide_branding` checked against current tier at every render — a downgraded Pro creator sees branding restored automatically

## Success Criteria

1. A Pro creator can set a custom background color and see it on their public profile within 2 seconds of changing it
2. A free creator sees Pro color options as locked with an upgrade prompt — cannot save custom values
3. A creator who downgrades from Pro to Free sees their custom theme values preserved in the DB but the public page reverts to the preset (custom values display in the dashboard as "Restored when you upgrade to Pro again")
4. Profile with no custom values renders identical to the current Feature 11 behavior
5. `npm run build` passes with no type errors

## Migration Plan

Existing creators: all new Pro fields are nullable, default to null. Existing free-tier presets work unchanged. Zero visual change for existing users on deploy.

When v1 Feature 20 (Pro tier billing) ships, the Pro section unlocks automatically based on `user.tier`.

## Open Questions

- "Reset to default" button — should it clear all Pro custom values at once? Recommend yes, include in scope.
- Color picker UX on mobile — HTML `<input type="color">` is workable but not great. Consider a hex input alongside it.
- Should hide_branding work at the free tier too if a creator just doesn't want it? Recommend no — branding removal is a real Pro upgrade reason.
