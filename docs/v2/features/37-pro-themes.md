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

`PATCH /api/profile/appearance` — extend existing endpoint to accept new fields:

```ts
{
  theme_preset?: string           // existing
  button_style?: string           // existing
  theme_bg_color?: string         // new, Pro only
  theme_accent_color?: string     // new, Pro only
  theme_button_color?: string     // new, Pro only
  theme_button_text?: string      // new, Pro only
  theme_card_bg?: string          // new, Pro only
  theme_card_text?: string        // new, Pro only
  theme_font?: string             // new, Pro only
  hide_branding?: boolean         // new, Pro only
}
```

Server validates that the caller's tier is PRO/BUSINESS/CONTENT_HOUSE before accepting the Pro-only fields. Free tier callers sending these fields get a 403.

## Public Profile Rendering

The public profile page (`app/[username]/page.tsx`) currently builds a `themeStyle` object from `THEME_VARS`. Extend this:

1. If the profile has any custom color fields set, those override the preset values on a per-field basis
2. If `theme_font` is set, load the corresponding Google Font and inject it as a CSS variable on the page wrapper
3. If `hide_branding` is true, suppress the "Powered by Sub-tree" footer

Font loading must be server-side (next/font/google dynamic import, or a pre-loaded set). Do not lazy-load fonts client-side — it causes layout shift on 3G.

## Acceptance Criteria

- [ ] A Pro creator can set a custom hex color for each of the 6 color roles
- [ ] Changes reflect in the live preview pane within 800ms
- [ ] The public profile page applies the custom colors correctly
- [ ] A Free creator sees the Pro color pickers in a locked state with an upgrade prompt
- [ ] A Free creator's existing theme preset is unaffected
- [ ] `hide_branding: true` removes the "Powered by Sub-tree" footer on the public page only — it still appears in the dashboard preview
- [ ] Custom fonts load without layout shift on a throttled 3G connection
- [ ] Sending Pro-only fields as a Free user returns 403
