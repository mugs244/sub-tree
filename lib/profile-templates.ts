// Templates are whole-page designs for a creator's public page. Each one is
// copied from a design reference: it picks a `layout` (the page structure,
// rendered by components/profile-templates/TemplatePage.tsx), a font, and the
// colours that layout uses. Unlike the colour-only theme presets they change
// the page's structure.
//
// They're stored in Profile.theme_preset like any preset, so every value must
// also be accepted by app/api/profile/appearance/route.ts.

export type TemplateLayout =
  | "pop"   // rounded panel on a canvas, chunky bordered buttons that press down
  | "rows"  // full-bleed, soft avatar, solid colour rows with icon + subtitle + chevron

export type TemplateFont = "geist" | "inter"

export interface ProfileTemplate {
  value: string
  label: string
  blurb: string
  layout: TemplateLayout
  font: TemplateFont
  colors: {
    canvas: string     // page background
    panel: string      // card everything sits on ("pop"); same as canvas for "rows"
    text: string
    muted: string
    handle: string     // the @username
    linkBg: string
    linkText: string
    border: string     // outline on buttons and avatar ("pop")
    ledge: string      // solid "shadow" under buttons ("pop")
    accent: string     // Support button
    accentText: string
  }
}

export const PROFILE_TEMPLATES: ProfileTemplate[] = [
  {
    value: "orange",
    label: "Orange",
    blurb: "Off-white with orange, like the Sub-tree homepage",
    layout: "pop",
    font: "geist",
    colors: {
      canvas: "#eeede8",
      panel: "#fafaf8",
      text: "#111827",
      muted: "#4b5563",
      handle: "#f97316",
      linkBg: "#ffffff",
      linkText: "#111827",
      border: "#111827",
      ledge: "#111827",
      accent: "#ff9a4d",
      accentText: "#111827",
    },
  },
  {
    value: "orange-night",
    label: "Orange night",
    blurb: "The same bold look on a dark background",
    layout: "pop",
    font: "geist",
    colors: {
      canvas: "#030712",
      panel: "#111827",
      text: "#f9fafb",
      muted: "#9ca3af",
      handle: "#ff9a4d",
      linkBg: "#1f2937",
      linkText: "#f9fafb",
      border: "#4b5563",
      ledge: "#000000",
      accent: "#ff9a4d",
      accentText: "#111827",
    },
  },
  {
    value: "citrus",
    label: "Citrus",
    blurb: "Bright orange link rows with icons and subtitles",
    layout: "rows",
    font: "inter",
    colors: {
      canvas: "#f6f7f9",
      panel: "#f6f7f9",
      text: "#111827",
      muted: "#4b5563",
      handle: "#f26a2e",
      linkBg: "#f26a2e",
      linkText: "#ffffff",
      border: "#ffffff",
      ledge: "transparent",
      accent: "#f26a2e",
      accentText: "#ffffff",
    },
  },
]

export const PROFILE_TEMPLATE_VALUES = PROFILE_TEMPLATES.map((t) => t.value)

export function getProfileTemplate(preset: string | null | undefined): ProfileTemplate | null {
  return PROFILE_TEMPLATES.find((t) => t.value === preset) ?? null
}
