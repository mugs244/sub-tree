"use client"

import { useEffect, useState } from "react"

interface Status {
  enabled: boolean
  launchAt: string | null
}

function formatCountdown(launchAt: string): string {
  const diffMs = new Date(launchAt).getTime() - Date.now()
  if (diffMs <= 0) return "Any moment now"

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// Self-hides once donations are enabled — safe to drop anywhere without a
// parent needing to check status first. `compact` swaps the layout for tight
// spaces like replacing the public donate button.
export function DonationLaunchNotice({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status | null>(null)
  const [countdown, setCountdown] = useState("")
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/public/donation-launch/status")
      .then((res) => res.json())
      .then(({ data }: { data: Status }) => setStatus(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!status?.launchAt) return
    setCountdown(formatCountdown(status.launchAt))
    const interval = setInterval(() => setCountdown(formatCountdown(status.launchAt!)), 60_000)
    return () => clearInterval(interval)
  }, [status?.launchAt])

  if (!status || status.enabled) return null

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState("sending")
    setError(null)
    try {
      const res = await fetch("/api/public/donation-launch/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.message ?? "Something went wrong")
        setState("error")
        return
      }
      setState("done")
    } catch {
      setError("Something went wrong")
      setState("error")
    }
  }

  // Hardcoded neutral colors, not the theme-driven bg-surface/border-border/
  // text-muted-foreground/bg-primary classes — this is platform-level
  // messaging shown on public profile pages, and must never inherit a
  // creator's custom theme CSS variables (which override those exact tokens).
  return (
    <div
      className={[
        "rounded-xl border border-gray-200 bg-gray-50 text-center",
        compact ? "p-4 space-y-2" : "p-4 sm:p-6 space-y-3",
      ].join(" ")}
    >
      <p className={compact ? "text-xs font-medium text-gray-500" : "text-sm font-medium text-gray-900"}>
        Donations aren&apos;t open yet
      </p>
      {status.launchAt && (
        <p className={compact ? "text-lg font-semibold tracking-tight text-gray-900" : "text-2xl font-semibold tracking-tight text-gray-900"}>
          {countdown}
        </p>
      )}

      {state === "done" ? (
        <p className="text-xs text-gray-500">You&apos;ll get an email the moment donations go live.</p>
      ) : (
        <form
          onSubmit={submit}
          className={[
            "flex gap-2 items-center justify-center",
            compact ? "flex-col" : "flex-col sm:flex-row",
          ].join(" ")}
        >
          <label htmlFor="donation-launch-email" className="sr-only">
            Email address
          </label>
          <input
            id="donation-launch-email"
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="rounded-lg bg-gray-900 text-white text-sm font-medium px-4 py-2 h-9 whitespace-nowrap hover:bg-gray-800 transition-colors duration-150 disabled:opacity-50"
          >
            {state === "sending" ? "…" : "Notify me when it's ready"}
          </button>
        </form>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
