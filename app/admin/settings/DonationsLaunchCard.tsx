"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface Props {
  initialEnabled: boolean
  initialLaunchAt: string | null
  initialPendingSubscribers: number
}

// Local datetime-local input expects "YYYY-MM-DDTHH:mm" with no timezone —
// derive it from the ISO string in the browser's own timezone.
function toLocalInputValue(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function DonationsLaunchCard({ initialEnabled, initialLaunchAt, initialPendingSubscribers }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [launchAtLocal, setLaunchAtLocal] = useState(toLocalInputValue(initialLaunchAt))
  const [pendingSubscribers, setPendingSubscribers] = useState(initialPendingSubscribers)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function save(nextEnabled: boolean) {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/donations-launch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: nextEnabled,
          launchAt: launchAtLocal ? new Date(launchAtLocal).toISOString() : null,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.message ?? "Failed to save")
        return
      }
      setEnabled(nextEnabled)
      if (body.data.notifiedCount > 0) {
        setMessage(`Donations enabled — notified ${body.data.notifiedCount} waiting subscriber${body.data.notifiedCount === 1 ? "" : "s"}.`)
        setPendingSubscribers(0)
      } else {
        setMessage("Saved.")
      }
    } catch {
      setError("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Donations launch gate</h2>
          <p className="text-xs text-muted-foreground mt-1">
            While disabled, the public donate button is greyed out everywhere and visitors can opt in to be
            emailed the moment you enable it. {pendingSubscribers} waiting to be notified.
          </p>
        </div>
        <span
          className={[
            "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full",
            enabled ? "bg-success-bg text-success" : "bg-warning-bg text-warning",
          ].join(" ")}
        >
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label htmlFor="launch-at" className="block text-xs text-muted-foreground mb-1">
            Target launch date (shown as a countdown — optional)
          </label>
          <input
            id="launch-at"
            type="datetime-local"
            value={launchAtLocal}
            onChange={(e) => setLaunchAtLocal(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button onClick={() => void save(enabled)} disabled={saving} variant="outline" size="sm">
          Save date
        </Button>
      </div>

      <div className="flex gap-2 pt-1">
        {enabled ? (
          <Button onClick={() => void save(false)} disabled={saving} variant="outline" size="sm">
            Disable donations
          </Button>
        ) : (
          <Button onClick={() => void save(true)} disabled={saving} size="sm">
            {saving ? "…" : "Enable donations now"}
          </Button>
        )}
      </div>

      {message && <p className="text-xs text-success">{message}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
