"use client"

import { useState } from "react"
import { Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const THEME_PRESETS = [
  { value: "default", label: "Default", bg: "#ffffff", accent: "#111827" },
  { value: "warm", label: "Warm", bg: "#fffbf5", accent: "#92400e" },
  { value: "cool", label: "Cool", bg: "#f0f9ff", accent: "#0369a1" },
  { value: "forest", label: "Forest", bg: "#f0fdf4", accent: "#15803d" },
  { value: "midnight", label: "Midnight", bg: "#0f172a", accent: "#e2e8f0" },
]

const BUTTON_STYLES = [
  { value: "rounded", label: "Rounded" },
  { value: "pill", label: "Pill" },
  { value: "sharp", label: "Sharp" },
]

interface AppearanceFormProps {
  initialTheme: string
  initialButtonStyle: string
}

export function AppearanceForm({ initialTheme, initialButtonStyle }: AppearanceFormProps) {
  const [theme, setTheme] = useState(initialTheme)
  const [buttonStyle, setButtonStyle] = useState(initialButtonStyle)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="space-y-8">
      <div className="space-y-3">
        <Label className="text-sm font-medium">Theme</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setTheme(preset.value)}
              className={[
                "flex flex-col items-start gap-2 p-3 rounded-xl border-2 text-left transition-colors duration-150",
                theme === preset.value ? "border-foreground" : "border-border hover:border-foreground/30",
              ].join(" ")}
            >
              <span
                className="h-8 w-full rounded-md border border-border"
                style={{ background: preset.bg, borderColor: preset.accent }}
              />
              <span className="text-xs font-medium">{preset.label}</span>
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
                style.value === "rounded" ? "rounded-lg" : style.value === "pill" ? "rounded-full" : "rounded-none",
                buttonStyle === style.value ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/30",
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
  )
}
