"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

// One admin action button: optional confirm, POST JSON, show the result,
// refresh the page's data.
export function AdminAction({
  url,
  body,
  label,
  confirm,
  tone = "default",
}: {
  url: string
  body: Record<string, unknown>
  label: string
  confirm?: string
  tone?: "default" | "danger" | "success"
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function run() {
    if (confirm && !window.confirm(confirm)) return
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const json = await res.json().catch(() => ({}))
      setMessage(res.ok ? (json?.data?.message ?? "Done") : (json?.message ?? "Failed"))
      if (res.ok) router.refresh()
    } catch {
      setMessage("Network error")
    } finally {
      setBusy(false)
    }
  }

  const color =
    tone === "danger" ? "border-destructive/40 text-destructive hover:bg-destructive/10"
    : tone === "success" ? "border-success/40 text-success hover:bg-success/10"
    : "border-border hover:bg-surface"

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className={["rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50", color].join(" ")}
      >
        {busy ? "…" : label}
      </button>
      {message && <span className="text-[11px] text-muted-foreground">{message}</span>}
    </span>
  )
}
