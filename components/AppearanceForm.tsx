"use client"

import { useState } from "react"
import { Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const THEME_PRESETS = [
  {
    value: "default",
    label: "Default",
    swatch: "#ffffff",
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
    swatch: "#fffbf5",
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
    swatch: "#f0f9ff",
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
    swatch: "#f0fdf4",
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
    swatch: "#0f172a",
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
  { value: "rounded", label: "Rounded", radius: "8px" },
  { value: "pill", label: "Pill", radius: "9999px" },
  { value: "sharp", label: "Sharp", radius: "0px" },
]

interface AppearanceFormProps {
  initialTheme: string
  initialButtonStyle: string
  displayName?: string
  username?: string
  avatarUrl?: string
}

export function AppearanceForm({
  initialTheme,
  initialButtonStyle,
  displayName = "Your Name",
  username = "username",
  avatarUrl,
}: AppearanceFormProps) {
  const [theme, setTheme] = useState(initialTheme)
  const [buttonStyle, setButtonStyle] = useState(initialButtonStyle)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeTheme = THEME_PRESETS.find((p) => p.value === theme) ?? THEME_PRESETS[0]!
  const activeButton = BUTTON_STYLES.find((s) => s.value === buttonStyle) ?? BUTTON_STYLES[0]!

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch("/api/profile/appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme_preset: theme, button_style: buttonStyle }),
      })
      if (!res.ok) {
        const body = (await res.json()) as { message: string }
        setError(body.message ?? "Could not save appearance")
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("Could not save — please try again")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* Controls */}
      <div className="flex-1 space-y-8 min-w-0">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Theme</Label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setTheme(preset.value)}
                className={[
                  "flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 text-center transition-colors duration-150",
                  theme === preset.value
                    ? "border-foreground"
                    : "border-border hover:border-foreground/30",
                ].join(" ")}
              >
                <span
                  className="h-7 w-full rounded-md border"
                  style={{
                    background: preset.vars.bg,
                    borderColor: preset.vars.border,
                  }}
                />
                <span className="text-[11px] font-medium leading-none">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Button style</Label>
          <div className="flex gap-3">
            {BUTTON_STYLES.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => setButtonStyle(style.value)}
                className={[
                  "flex-1 py-2 text-sm font-medium border-2 transition-colors duration-150",
                  style.value === "rounded"
                    ? "rounded-lg"
                    : style.value === "pill"
                      ? "rounded-full"
                      : "rounded-none",
                  buttonStyle === style.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground/30",
                ].join(" ")}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
          ) : saved ? (
            <><Check className="h-4 w-4 mr-2" />Saved</>
          ) : (
            "Save appearance"
          )}
        </Button>
      </div>

      {/* Live preview */}
      <div className="lg:w-64 shrink-0">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Preview</p>
        <div
          className="rounded-2xl border overflow-hidden shadow-sm"
          style={{ borderColor: activeTheme.vars.border }}
        >
          <div
            className="px-5 py-8 flex flex-col items-center gap-4"
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
                className="h-14 w-14 rounded-full border flex items-center justify-center text-lg font-semibold"
                style={{
                  background: activeTheme.vars.surface,
                  borderColor: activeTheme.vars.border,
                  color: activeTheme.vars.text,
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name + handle */}
            <div className="text-center space-y-0.5">
              <p className="text-sm font-semibold" style={{ color: activeTheme.vars.text }}>
                {displayName}
              </p>
              <p className="text-xs font-mono" style={{ color: activeTheme.vars.muted }}>
                @{username}
              </p>
            </div>

            {/* Sample links */}
            <div className="w-full space-y-2">
              {["My Website", "YouTube", "Instagram"].map((label) => (
                <div
                  key={label}
                  className="w-full py-2 text-xs font-medium text-center border"
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
                className="w-full py-2 text-xs font-medium text-center"
                style={{
                  borderRadius: activeButton.radius,
                  background: activeTheme.vars.accent,
                  color: activeTheme.vars.accentFg,
                }}
              >
                Support me
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
