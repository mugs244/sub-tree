"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Check, Loader2, ExternalLink } from "lucide-react"
import { Label } from "@/components/ui/label"

const THEME_PRESETS = [
  {
    value: "default",
    label: "Default",
    vars: {
      bg: "#ffffff",
      surface: "#f9fafb",
      text: "#111827",
      muted: "#6b7280",
      border: "#e5e7eb",
      accent: "#111827",
      accentFg: "#ffffff",
    },
  },
  {
    value: "warm",
    label: "Warm",
    vars: {
      bg: "#fffbf5",
      surface: "#f5ede0",
      text: "#1c1917",
      muted: "#78716c",
      border: "#e7e5e4",
      accent: "#92400e",
      accentFg: "#ffffff",
    },
  },
  {
    value: "cool",
    label: "Cool",
    vars: {
      bg: "#f0f9ff",
      surface: "#e0f2fe",
      text: "#0c4a6e",
      muted: "#0369a1",
      border: "#bae6fd",
      accent: "#0369a1",
      accentFg: "#ffffff",
    },
  },
  {
    value: "forest",
    label: "Forest",
    vars: {
      bg: "#f0fdf4",
      surface: "#dcfce7",
      text: "#14532d",
      muted: "#166534",
      border: "#bbf7d0",
      accent: "#15803d",
      accentFg: "#ffffff",
    },
  },
  {
    value: "midnight",
    label: "Midnight",
    vars: {
      bg: "#0f172a",
      surface: "#1e293b",
      text: "#e2e8f0",
      muted: "#94a3b8",
      border: "#334155",
      accent: "#e2e8f0",
      accentFg: "#0f172a",
    },
  },
]

const BUTTON_STYLES = [
  { value: "rounded", label: "Rounded", radius: "8px", previewRadius: "rounded-lg" },
  { value: "pill",    label: "Pill",    radius: "9999px", previewRadius: "rounded-full" },
  { value: "sharp",   label: "Sharp",   radius: "0px", previewRadius: "rounded-none" },
]

type SaveState = "idle" | "saving" | "saved" | "error"

interface AppearanceFormProps {
  initialTheme: string
  initialButtonStyle: string
  displayName?: string
  username?: string
  avatarUrl?: string
  bio?: string
}

export function AppearanceForm({
  initialTheme,
  initialButtonStyle,
  displayName = "Your Name",
  username = "username",
  avatarUrl,
  bio,
}: AppearanceFormProps) {
  const [theme, setTheme] = useState(initialTheme)
  const [buttonStyle, setButtonStyle] = useState(initialButtonStyle)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  const activeTheme = THEME_PRESETS.find((p) => p.value === theme) ?? THEME_PRESETS[0]!
  const activeButton = BUTTON_STYLES.find((s) => s.value === buttonStyle) ?? BUTTON_STYLES[0]!

  const save = useCallback(async (t: string, b: string) => {
    setSaveState("saving")
    try {
      const res = await fetch("/api/profile/appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme_preset: t, button_style: b }),
      })
      if (!res.ok) {
        setSaveState("error")
        setTimeout(() => setSaveState("idle"), 3000)
        return
      }
      setSaveState("saved")
      setTimeout(() => setSaveState("idle"), 2000)
    } catch {
      setSaveState("error")
      setTimeout(() => setSaveState("idle"), 3000)
    }
  }, [])

  // Auto-save 800ms after the last change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(theme, buttonStyle), 800)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [theme, buttonStyle, save])

  return (
    <div className="flex flex-col xl:flex-row gap-8 xl:gap-14">
      {/* ── Controls ──────────────────────────────────────── */}
      <div className="flex-1 space-y-8 min-w-0">

        {/* Theme */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Theme</Label>
            <SaveIndicator state={saveState} />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {THEME_PRESETS.map((preset) => {
              const active = theme === preset.value
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setTheme(preset.value)}
                  aria-label={`${preset.label} theme`}
                  aria-pressed={active}
                  className={[
                    "group relative flex flex-col rounded-xl border-2 overflow-hidden transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
                    active ? "border-foreground shadow-sm" : "border-border hover:border-foreground/30",
                  ].join(" ")}
                >
                  {/* Swatch: top 2/3 = bg, bottom strip = accent */}
                  <span
                    className="block h-10 w-full"
                    style={{ background: preset.vars.bg }}
                  />
                  <span
                    className="block h-3 w-full"
                    style={{ background: preset.vars.accent }}
                  />
                  <span
                    className="block px-1 py-1.5 text-[10px] font-medium text-center leading-none"
                    style={{
                      background: preset.vars.surface,
                      color: preset.vars.muted,
                    }}
                  >
                    {preset.label}
                  </span>
                  {active && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/10">
                      <Check className="h-2.5 w-2.5 text-gray-900" strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
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
                  onClick={() => setButtonStyle(s.value)}
                  aria-label={`${s.label} button style`}
                  aria-pressed={active}
                  className={[
                    "flex flex-col items-center gap-2.5 p-4 border-2 rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
                    active ? "border-foreground bg-surface shadow-sm" : "border-border hover:border-foreground/30",
                  ].join(" ")}
                >
                  {/* Mini button preview */}
                  <span
                    className={[
                      "block w-full h-6 border border-border bg-background",
                      s.previewRadius,
                    ].join(" ")}
                  />
                  <span className="text-[11px] font-medium">{s.label}</span>
                </button>
              )
            })}
          </div>
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

        {/* Browser chrome wrapper */}
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
          <div
            className="px-5 py-7 flex flex-col items-center gap-4"
            style={{ background: activeTheme.vars.bg }}
          >
            {/* Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-14 w-14 rounded-full object-cover border"
                style={{ borderColor: activeTheme.vars.border }}
              />
            ) : (
              <div
                className="h-14 w-14 rounded-full border-2 flex items-center justify-center text-lg font-semibold"
                style={{
                  background: activeTheme.vars.surface,
                  borderColor: activeTheme.vars.border,
                  color: activeTheme.vars.text,
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name + handle + bio */}
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold" style={{ color: activeTheme.vars.text }}>
                {displayName}
              </p>
              <p className="text-[10px] font-mono" style={{ color: activeTheme.vars.muted }}>
                @{username}
              </p>
              {bio && (
                <p
                  className="text-[10px] leading-relaxed max-w-[180px] mx-auto pt-0.5"
                  style={{ color: activeTheme.vars.muted }}
                >
                  {bio.length > 80 ? bio.slice(0, 80) + "…" : bio}
                </p>
              )}
            </div>

            {/* Sample links */}
            <div className="w-full space-y-2">
              {["My Website", "YouTube", "Instagram"].map((label) => (
                <div
                  key={label}
                  className="w-full py-2 text-[10px] font-medium text-center border"
                  style={{
                    borderRadius: activeButton.radius,
                    borderColor: activeTheme.vars.border,
                    background: activeTheme.vars.bg,
                    color: activeTheme.vars.text,
                  }}
                >
                  {label}
                </div>
              ))}

              {/* Donate CTA */}
              <div
                className="w-full py-2 text-[10px] font-medium text-center mt-1"
                style={{
                  borderRadius: activeButton.radius,
                  background: activeTheme.vars.accent,
                  color: activeTheme.vars.accentFg,
                }}
              >
                Support {displayName.split(" ")[0]}
              </div>
            </div>

            {/* Powered by */}
            <p className="text-[9px] pt-1" style={{ color: activeTheme.vars.muted }}>
              Powered by Sub-tree
            </p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Changes save automatically
        </p>
      </div>
    </div>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null
  return (
    <span
      className={[
        "inline-flex items-center gap-1 text-xs transition-opacity duration-150",
        state === "error" ? "text-destructive" : "text-muted-foreground",
      ].join(" ")}
    >
      {state === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
      {state === "saved" && <Check className="h-3 w-3 text-success" />}
      {state === "saving" && "Saving…"}
      {state === "saved" && "Saved"}
      {state === "error" && "Could not save — try again"}
    </span>
  )
}
