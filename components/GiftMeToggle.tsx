"use client"

import { useState } from "react"
import { RowIcon, type SettingsIcon } from "@/components/settings/RowLabel"

interface Props {
  initialEnabled: boolean
  icon?: SettingsIcon
}

export function GiftMeToggle({ initialEnabled, icon }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    const next = !enabled
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/profile/gift-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      })
      if (!res.ok) {
        setError("Failed to save")
        return
      }
      setEnabled(next)
    } catch {
      setError("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="flex gap-3">
        {icon && <RowIcon icon={icon} className="mt-0.5" />}
        <div>
        <p className="text-[15px]">Gift me</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Show a coming-soon section on your public page where fans will be able to gift you WiFi, data, airtime, and TV subscriptions.
        </p>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={enabled ? "Hide gift me section" : "Show gift me section"}
        disabled={saving}
        onClick={() => void toggle()}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60",
          enabled ? "bg-primary" : "bg-muted",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200",
            enabled ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  )
}
