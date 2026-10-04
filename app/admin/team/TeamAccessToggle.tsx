"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

// "Can switch to Sub-shop admin" switch for one admin. Shows the Sub-shop
// invite link when one is created, so the super admin can send it.
export function TeamAccessToggle({ userId, initial }: { userId: number; initial: boolean }) {
  const [on, setOn] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function toggle() {
    const next = !on
    if (!next && !window.confirm("Remove this admin's access to the Sub-shop admin portal?")) return
    setBusy(true)
    setNote(null)
    setInviteUrl(null)
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, canAccessSubShop: next }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setNote(json.message ?? "Couldn't save — please try again")
        return
      }
      setOn(next)
      setNote(json.data?.syncNote ?? null)
      setInviteUrl(json.data?.inviteUrl ?? null)
    } catch {
      setNote("Network error — please try again")
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <label className="flex items-center gap-2 text-xs font-medium">
        Can switch to Sub-shop admin
        <button
          type="button"
          role="switch"
          aria-checked={on}
          disabled={busy}
          onClick={() => void toggle()}
          className={["relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors disabled:opacity-50", on ? "bg-foreground" : "bg-border"].join(" ")}
        >
          <span className={["absolute left-0 top-0 h-5 w-5 rounded-full bg-background shadow transition-transform", on ? "translate-x-5" : "translate-x-0"].join(" ")} />
        </button>
      </label>
      {note && <p className="max-w-xs text-right text-[11px] text-muted-foreground">{note}</p>}
      {inviteUrl && (
        <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-surface">
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy invite link"}
        </button>
      )}
    </div>
  )
}
