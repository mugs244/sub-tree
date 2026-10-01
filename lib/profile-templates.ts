// Templates are whole-page designs for a creator's public page, in the
// landing page's style: a rounded panel on a canvas, a bold Geist name, an
// orange @handle, chunky bordered link buttons that press down, and an
// orange Support button. Unlike the colour-only theme presets, they change
// the page's structure — app/[username]/page.tsx switches layout on them.
//
// They're stored in Profile.theme_preset like any preset, so the value must
// also be accepted by app/api/profile/appearance/route.ts.

export interface ProfileTemplate {
  value: string
  label: string
  blurb: string
  colors: {
    canvas: string     // page background around the panel
    panel: string      // the rounded card everything sits on
    text: string
    muted: string
    handle: string     // the @username
    linkBg: string
    linkText: string
    border: string     // chunky 2px outline on buttons and avatar
    ledge: string      // the solid "shadow" under buttons
    accent: string     // Support button
    accentText: string
  }
}

export const PROFILE_TEMPLATES: ProfileTemplate[] = [
  {
    value: "orange",
    label: "Orange",
    blurb: "Off-white with orange, like the Sub-tree homepage",
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
]

export const PROFILE_TEMPLATE_VALUES = PROFILE_TEMPLATES.map((t) => t.value)

export function getProfileTemplate(preset: string | null | undefined): ProfileTemplate | null {
  return PROFILE_TEMPLATES.find((t) => t.value === preset) ?? null
}
