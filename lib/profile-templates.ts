// A creator's public page = a TEMPLATE (the layout and style) + a THEME (the
// colours), chosen separately in Dashboard → Appearance. Every theme is
// designed for every template, so any combination is a finished page.
//
//   Profile.page_template  "pop" | "rows"   (null = not chosen → see templateFor)
//   Profile.theme_preset   a PAGE_THEMES value (anything else → Orange)
//
// resolveDesign() merges the two into the ProfileTemplate that
// components/profile-templates/TemplatePage.tsx renders.

export type TemplateLayout =
  | "pop"   // rounded panel on a canvas, chunky bordered buttons that press down
  | "rows"  // full-bleed, soft avatar, solid colour rows with icon + subtitle + chevron

export type TemplateFont = "geist" | "inter"

export interface PageTemplate {
  value: TemplateLayout
  label: string
  blurb: string
  font: TemplateFont
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  { value: "pop", label: "Bold", blurb: "Rounded panel with chunky buttons that press down", font: "geist" },
  { value: "rows", label: "Rows", blurb: "Solid colour link rows with icons and subtitles", font: "inter" },
]

export interface PageTheme {
  value: string
  label: string
  palette: {
    canvas: string      // page background
    panel: string       // the card on Bold
    text: string
    muted: string
    handle: string      // the @username
    accent: string      // Gift button; link rows on Rows
    accentText: string
    surface: string     // link buttons on Bold
    surfaceText: string
    outline: string     // button and avatar outlines on Bold
    ledge: string       // the solid "shadow" under Bold buttons
  }
}

export const PAGE_THEMES: PageTheme[] = [
  {
    value: "orange",
    label: "Orange",
    palette: { canvas: "#eeede8", panel: "#fafaf8", text: "#111827", muted: "#4b5563", handle: "#f97316", accent: "#ff9a4d", accentText: "#111827", surface: "#ffffff", surfaceText: "#111827", outline: "#111827", ledge: "#111827" },
  },
  {
    value: "orange-night",
    label: "Orange night",
    palette: { canvas: "#030712", panel: "#111827", text: "#f9fafb", muted: "#9ca3af", handle: "#ff9a4d", accent: "#ff9a4d", accentText: "#111827", surface: "#1f2937", surfaceText: "#f9fafb", outline: "#4b5563", ledge: "#000000" },
  },
  {
    value: "citrus",
    label: "Citrus",
    palette: { canvas: "#f6f7f9", panel: "#ffffff", text: "#111827", muted: "#4b5563", handle: "#f26a2e", accent: "#f26a2e", accentText: "#ffffff", surface: "#ffffff", surfaceText: "#111827", outline: "#f26a2e", ledge: "#c2410c" },
  },
  {
    value: "warm",
    label: "Warm",
    palette: { canvas: "#f5ede0", panel: "#fffbf5", text: "#1c1917", muted: "#78716c", handle: "#92400e", accent: "#92400e", accentText: "#ffffff", surface: "#ffffff", surfaceText: "#1c1917", outline: "#1c1917", ledge: "#1c1917" },
  },
  {
    value: "forest",
    label: "Forest",
    palette: { canvas: "#dcfce7", panel: "#f0fdf4", text: "#14532d", muted: "#166534", handle: "#15803d", accent: "#15803d", accentText: "#ffffff", surface: "#ffffff", surfaceText: "#14532d", outline: "#14532d", ledge: "#14532d" },
  },
  {
    value: "cool",
    label: "Cool",
    palette: { canvas: "#e0f2fe", panel: "#f0f9ff", text: "#0c4a6e", muted: "#0369a1", handle: "#0369a1", accent: "#0369a1", accentText: "#ffffff", surface: "#ffffff", surfaceText: "#0c4a6e", outline: "#0c4a6e", ledge: "#0c4a6e" },
  },
  {
    value: "midnight",
    label: "Midnight",
    palette: { canvas: "#020617", panel: "#0f172a", text: "#e2e8f0", muted: "#94a3b8", handle: "#cbd5e1", accent: "#e2e8f0", accentText: "#0f172a", surface: "#1e293b", surfaceText: "#e2e8f0", outline: "#334155", ledge: "#000000" },
  },
]

export const PAGE_TEMPLATE_VALUES = PAGE_TEMPLATES.map((t) => t.value)
export const PAGE_THEME_VALUES = PAGE_THEMES.map((t) => t.value)

// What TemplatePage renders: a layout, a font and the colours it uses.
export interface ProfileTemplate {
  layout: TemplateLayout
  font: TemplateFont
  colors: {
    canvas: string
    panel: string
    text: string
    muted: string
    handle: string
    linkBg: string
    linkText: string
    border: string
    ledge: string
    accent: string
    accentText: string
  }
}

export function themeFor(themePreset: string | null | undefined): PageTheme {
  return PAGE_THEMES.find((t) => t.value === themePreset) ?? PAGE_THEMES[0]!
}

// Pages saved before templates and themes were separate only have
// theme_preset; "citrus" was the Rows design, everything else Bold.
export function templateFor(pageTemplate: string | null | undefined, themePreset: string | null | undefined): PageTemplate {
  return PAGE_TEMPLATES.find((t) => t.value === pageTemplate) ?? (themePreset === "citrus" ? PAGE_TEMPLATES[1]! : PAGE_TEMPLATES[0]!)
}

export function resolveDesign(pageTemplate: string | null | undefined, themePreset: string | null | undefined): ProfileTemplate {
  const template = templateFor(pageTemplate, themePreset)
  const p = themeFor(themePreset).palette
  const colors =
    template.value === "rows"
      ? { canvas: p.canvas, panel: p.canvas, text: p.text, muted: p.muted, handle: p.handle, linkBg: p.accent, linkText: p.accentText, border: "#ffffff", ledge: "transparent", accent: p.accent, accentText: p.accentText }
      : { canvas: p.canvas, panel: p.panel, text: p.text, muted: p.muted, handle: p.handle, linkBg: p.surface, linkText: p.surfaceText, border: p.outline, ledge: p.ledge, accent: p.accent, accentText: p.accentText }
  return { layout: template.value, font: template.font, colors }
}
