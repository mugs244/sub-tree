"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Check, Loader2, ExternalLink, Lock } from "lucide-react"
import { Label } from "@/components/ui/label"
import Link from "next/link"

const FREE_PRESETS = [
  { value: "default", label: "Default",  vars: { bg: "#ffffff", surface: "#f9fafb", text: "#111827", muted: "#6b7280", border: "#e5e7eb", accent: "#111827", accentFg: "#ffffff" } },
  { value: "warm",    label: "Warm",     vars: { bg: "#fffbf5", surface: "#f5ede0", text: "#1c1917", muted: "#78716c", border: "#e7e5e4", accent: "#92400e", accentFg: "#ffffff" } },
  { value: "cool",    label: "Cool",     vars: { bg: "#f0f9ff", surface: "#e0f2fe", text: "#0c4a6e", muted: "#0369a1", border: "#bae6fd", accent: "#0369a1", accentFg: "#ffffff" } },
  { value: "forest",  label: "Forest",   vars: { bg: "#f0fdf4", surface: "#dcfce7", text: "#14532d", muted: "#166534", border: "#bbf7d0", accent: "#15803d", accentFg: "#ffffff" } },
  { value: "midnight",label: "Midnight", vars: { bg: "#0f172a", surface: "#1e293b", text: "#e2e8f0", muted: "#94a3b8", border: "#334155", accent: "#e2e8f0", accentFg: "#0f172a" } },
]

const PRO_PRESETS = [
  { value: "rose",    label: "Rose",    vars: { bg: "#fff1f2", surface: "#ffe4e6", text: "#881337", muted: "#9f1239", border: "#fecdd3", accent: "#e11d48", accentFg: "#ffffff" } },
  { value: "violet",  label: "Violet",  vars: { bg: "#f5f3ff", surface: "#ede9fe", text: "#2e1065", muted: "#6d28d9", border: "#ddd6fe", accent: "#7c3aed", accentFg: "#ffffff" } },
  { value: "amber",   label: "Amber",   vars: { bg: "#fffbeb", surface: "#fef3c7", text: "#78350f", muted: "#92400e", border: "#fde68a", accent: "#d97706", accentFg: "#ffffff" } },
  { value: "teal",    label: "Teal",    vars: { bg: "#f0fdfa", surface: "#ccfbf1", text: "#134e4a", muted: "#0f766e", border: "#99f6e4", accent: "#0d9488", accentFg: "#ffffff" } },
  { value: "slate",   label: "Slate",   vars: { bg: "#f8fafc", surface: "#f1f5f9", text: "#0f172a", muted: "#475569", border: "#cbd5e1", accent: "#475569", accentFg: "#ffffff" } },
  { value: "crimson", label: "Crimson", vars: { bg: "#1a0a0a", surface: "#2d1515", text: "#fde8e8", muted: "#f87171", border: "#7f1d1d", accent: "#ef4444", accentFg: "#1a0a0a" } },
  { value: "sage",    label: "Sage",    vars: { bg: "#f7f8f4", surface: "#eef0e8", text: "#1f2d1a", muted: "#4a5e3d", border: "#cdd4c3", accent: "#4d7c3f", accentFg: "#ffffff" } },
  { value: "dusk",    label: "Dusk",    vars: { bg: "#1c1b2e", surface: "#2a2845", text: "#e8e6f8", muted: "#a09cc4", border: "#3d3a5e", accent: "#8b5cf6", accentFg: "#ffffff" } },
]

const ALL_PRESETS = [...FREE_PRESETS, ...PRO_PRESETS]

const BUTTON_STYLES = [
  { value: "rounded", label: "Rounded", radius: "8px",    previewRadius: "rounded-lg" },
  { value: "pill",    label: "Pill",    radius: "9999px", previewRadius: "rounded-full" },
  { value: "sharp",   label: "Sharp",   radius: "0px",    previewRadius: "rounded-none" },
]

const FONTS = [
  { value: "geist",         label: "Geist Sans",       style: { fontFamily: "var(--font-geist-sans)" } },
  { value: "inter",         label: "Inter",            style: { fontFamily: "'Inter', sans-serif" } },
  { value: "playfair",      label: "Playfair Display", style: { fontFamily: "'Playfair Display', serif" } },
  { value: "space-grotesk", label: "Space Grotesk",    style: { fontFamily: "'Space Grotesk', sans-serif" } },
]

const COLOR_ROLES = [
  { key: "theme_bg_color",     label: "Page background" },
  { key: "theme_accent_color", label: "Accent" },
  { key: "theme_button_color", label: "Button background" },
  { key: "theme_button_text",  label: "Button text" },
  { key: "theme_card_bg",      label: "Card background" },
  { key: "theme_card_text",    label: "Card text" },
] as const

type ColorKey = (typeof COLOR_ROLES)[number]["key"]
type SaveState = "idle" | "saving" | "saved" | "error"

interface ProTheme {
  theme_bg_color:     string | null
  theme_accent_color: string | null
  theme_button_color: string | null
  theme_button_text:  string | null
  theme_card_bg:      string | null
  theme_card_text:    string | null
  theme_font:         string | null
  hide_branding:      boolean
}

interface AppearanceFormProps {
  initialTheme: string
  initialButtonStyle: string
  isPro: boolean
  proTheme: ProTheme
  displayName?: string
  username?: string
  avatarUrl?: string
  bio?: string
}

export function AppearanceForm({
  initialTheme,
  initialButtonStyle,
  isPro,
  proTheme: initialProTheme,
  displayName = "Your Name",
  username = "username",
  avatarUrl,
  bio,
}: AppearanceFormProps) {
  const [theme, setTheme] = useState(initialTheme)
  const [buttonStyle, setButtonStyle] = useState(initialButtonStyle)
  const [proTheme, setProTheme] = useState<ProTheme>(initialProTheme)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  const activePreset = ALL_PRESETS.find((p) => p.value === theme) ?? ALL_PRESETS[0]!
  const activeButton = BUTTON_STYLES.find((s) => s.value === buttonStyle) ?? BUTTON_STYLES[0]!

  // Resolved preview vars: custom overrides win over preset
  const previewVars = {
    bg:       proTheme.theme_bg_color     ?? activePreset.vars.bg,
    surface:  activePreset.vars.surface,
    text:     activePreset.vars.text,
    muted:    activePreset.vars.muted,
    border:   activePreset.vars.border,
    accent:   proTheme.theme_accent_color ?? activePreset.vars.accent,
    accentFg: activePreset.vars.accentFg,
    btnBg:    proTheme.theme_button_color ?? activePreset.vars.bg,
    btnText:  proTheme.theme_button_text  ?? activePreset.vars.text,
  }

  const save = useCallback(async (
    t: string,
    b: string,
    pt: ProTheme,
  ) => {
    setSaveState("saving")
    try {
      const payload: Record<string, unknown> = { theme_preset: t, button_style: b }
      if (isPro) {
        Object.assign(payload, {
          theme_bg_color:     pt.theme_bg_color     ?? null,
          theme_accent_color: pt.theme_accent_color ?? null,
          theme_button_color: pt.theme_button_color ?? null,
          theme_button_text:  pt.theme_button_text  ?? null,
          theme_card_bg:      pt.theme_card_bg      ?? null,
          theme_card_text:    pt.theme_card_text    ?? null,
          theme_font:         pt.theme_font         ?? null,
          hide_branding:      pt.hide_branding,
        })
      }
      const res = await fetch("/api/profile/appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      setSaveState(res.ok ? "saved" : "error")
      setTimeout(() => setSaveState("idle"), 2000)
    } catch {
      setSaveState("error")
      setTimeout(() => setSaveState("idle"), 3000)
    }
  }, [isPro])

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(theme, buttonStyle, proTheme), 800)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [theme, buttonStyle, proTheme, save])

  function setColor(key: ColorKey, value: string) {
    setProTheme((prev) => ({ ...prev, [key]: value }))
  }

  function resetProColors() {
    setProTheme((prev) => ({
      ...prev,
      theme_bg_color: null, theme_accent_color: null,
      theme_button_color: null, theme_button_text: null,
      theme_card_bg: null, theme_card_text: null,
    }))
  }

  return (
    <div className="flex flex-col xl:flex-row gap-8 xl:gap-14">
      {/* ── Controls ──────────────────────────────────────── */}
      <div className="flex-1 space-y-8 min-w-0">

        {/* Free presets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Theme</Label>
            <SaveIndicator state={saveState} />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {FREE_PRESETS.map((preset) => (
              <PresetSwatch
                key={preset.value}
                preset={preset}
                active={theme === preset.value}
                onClick={() => { navigator?.vibrate?.(20); setTheme(preset.value) }}
              />
            ))}
          </div>
        </div>

        {/* Pro presets */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Pro themes</Label>
            {!isPro && <ProBadge />}
          </div>
          <div className={["grid grid-cols-4 gap-2", !isPro ? "opacity-50 pointer-events-none select-none" : ""].join(" ")}>
            {PRO_PRESETS.map((preset) => (
              <PresetSwatch
                key={preset.value}
                preset={preset}
                active={theme === preset.value}
                onClick={() => { navigator?.vibrate?.(20); setTheme(preset.value) }}
              />
            ))}
          </div>
        </div>

        {/* Button style */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Button style</Label>
          <div className="grid grid-cols-3 gap-2">
            {BUTTON_STYLES.map((s) => {
              const active = buttonStyle === s.value
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => { navigator?.vibrate?.(20); setButtonStyle(s.value) }}
                  aria-pressed={active}
                  className={[
                    "flex flex-col items-center gap-2.5 p-4 border-2 rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
                    active ? "border-foreground bg-surface shadow-sm" : "border-border hover:border-foreground/30",
                  ].join(" ")}
                >
                  <span className={["block w-full h-6 border border-border bg-background", s.previewRadius].join(" ")} />
                  <span className="text-[11px] font-medium">{s.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Pro section ─────────────────────────────────── */}
        <div className={["space-y-6 rounded-xl border p-5", isPro ? "border-[color:var(--border-default)]" : "border-dashed border-[color:var(--border-default)] bg-[color:var(--bg-raised)]"].join(" ")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold">Custom colors</Label>
              {!isPro && <ProBadge />}
            </div>
            {isPro && (
              <button
                type="button"
                onClick={resetProColors}
                className="text-[12px] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors"
              >
                Reset to preset
              </button>
            )}
          </div>

          {!isPro ? (
            <p className="text-[13px] text-[color:var(--text-secondary)]">
              Custom colors, fonts, and branding controls are unlocked on the Pro plan.{" "}
              <Link href="/onboarding/plan" className="underline underline-offset-2">
                Upgrade to Pro
              </Link>
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {COLOR_ROLES.map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[12px] text-[color:var(--text-secondary)]">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={proTheme[key] ?? activePreset.vars.bg}
                        onChange={(e) => setColor(key, e.target.value)}
                        className="h-8 w-8 rounded cursor-pointer border border-[color:var(--border-default)] p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        value={proTheme[key] ?? ""}
                        placeholder={activePreset.vars.bg}
                        onChange={(e) => {
                          const v = e.target.value
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                            setProTheme((prev) => ({ ...prev, [key]: v.length === 7 ? v : null }))
                          }
                        }}
                        className="flex-1 min-w-0 text-[12px] font-mono rounded border border-[color:var(--border-default)] bg-[color:var(--bg-surface)] px-2 py-1.5 placeholder:text-[color:var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]"
                        maxLength={7}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Font selector */}
              <div className="space-y-2">
                <Label className="text-[12px] text-[color:var(--text-secondary)]">Font</Label>
                <div className="grid grid-cols-2 gap-2">
                  {FONTS.map((f) => {
                    const active = (proTheme.theme_font ?? "geist") === f.value
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setProTheme((prev) => ({ ...prev, theme_font: f.value }))}
                        className={[
                          "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all",
                          active ? "border-[color:var(--accent)] bg-[color:var(--accent)]/5" : "border-[color:var(--border-default)] hover:border-[color:var(--border-strong)]",
                        ].join(" ")}
                      >
                        <span className="text-base leading-none" style={f.style}>Aa</span>
                        <span className="text-[12px] font-medium">{f.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Hide branding */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium">Remove Sub-tree branding</p>
                  <p className="text-[12px] text-[color:var(--text-muted)]">Hides "Powered by Sub-tree" on your public page</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={proTheme.hide_branding}
                  onClick={() => setProTheme((prev) => ({ ...prev, hide_branding: !prev.hide_branding }))}
                  className={[
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2",
                    proTheme.hide_branding ? "bg-[color:var(--accent)]" : "bg-[color:var(--border-default)]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                      proTheme.hide_branding ? "translate-x-4" : "translate-x-0.5",
                    ].join(" ")}
                  />
                </button>
              </div>
            </>
          )}
        </div>

        {/* View live */}
        <a
          href={`/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View live profile
        </a>
      </div>

      {/* ── Live preview ──────────────────────────────────── */}
      <div className="xl:w-72 shrink-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Live preview
        </p>

        <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* URL bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-surface border-b border-border">
            <div className="flex gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
            </div>
            <span className="flex-1 text-center text-[10px] font-mono text-muted-foreground bg-background rounded px-2 py-0.5 border border-border">
              sub-tree.com/{username}
            </span>
          </div>

          {/* Profile content */}
          <div className="px-5 py-7 flex flex-col items-center gap-4" style={{ background: previewVars.bg }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover border" style={{ borderColor: previewVars.border }} />
            ) : (
              <div
                className="h-14 w-14 rounded-full border-2 flex items-center justify-center text-lg font-semibold"
                style={{ background: previewVars.surface, borderColor: previewVars.border, color: previewVars.text }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="text-center space-y-1">
              <p className="text-sm font-semibold" style={{ color: previewVars.text }}>{displayName}</p>
              <p className="text-[10px] font-mono" style={{ color: previewVars.muted }}>@{username}</p>
              {bio && (
                <p className="text-[10px] leading-relaxed max-w-[180px] mx-auto pt-0.5" style={{ color: previewVars.muted }}>
                  {bio.length > 80 ? bio.slice(0, 80) + "…" : bio}
                </p>
              )}
            </div>

            <div className="w-full space-y-2">
              {["My Website", "YouTube", "Instagram"].map((label) => (
                <div
                  key={label}
                  className="w-full py-2 text-[10px] font-medium text-center border"
                  style={{ borderRadius: activeButton.radius, borderColor: previewVars.border, background: previewVars.btnBg, color: previewVars.btnText }}
                >
                  {label}
                </div>
              ))}
              <div
                className="w-full py-2 text-[10px] font-medium text-center mt-1"
                style={{ borderRadius: activeButton.radius, background: previewVars.accent, color: previewVars.accentFg }}
              >
                Support {displayName.split(" ")[0]}
              </div>
            </div>

            {!proTheme.hide_branding && (
              <p className="text-[9px] pt-1" style={{ color: previewVars.muted }}>Powered by Sub-tree</p>
            )}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-2">Changes save automatically</p>
      </div>
    </div>
  )
}

function PresetSwatch({
  preset, active, onClick,
}: {
  preset: { value: string; label: string; vars: { bg: string; surface: string; accent: string; muted: string } }
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${preset.label} theme`}
      aria-pressed={active}
      className={[
        "group relative flex flex-col rounded-xl border-2 overflow-hidden transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
        active ? "border-foreground shadow-sm" : "border-border hover:border-foreground/30",
      ].join(" ")}
    >
      <span className="block h-10 w-full" style={{ background: preset.vars.bg }} />
      <span className="block h-3 w-full" style={{ background: preset.vars.accent }} />
      <span className="block px-1 py-1.5 text-[10px] font-medium text-center leading-none" style={{ background: preset.vars.surface, color: preset.vars.muted }}>
        {preset.label}
      </span>
      {active && (
        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/10">
          <Check className="h-2.5 w-2.5 text-gray-900" strokeWidth={3} />
        </span>
      )}
    </button>
  )
}

function ProBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
      <Lock className="h-2.5 w-2.5" />
      Pro
    </span>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null
  return (
    <span className={["inline-flex items-center gap-1 text-xs transition-opacity duration-150", state === "error" ? "text-destructive" : "text-muted-foreground"].join(" ")}>
      {state === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
      {state === "saved"  && <Check className="h-3 w-3 text-success" />}
      {state === "saving" && "Saving…"}
      {state === "saved"  && "Saved"}
      {state === "error"  && "Could not save — try again"}
    </span>
  )
}
