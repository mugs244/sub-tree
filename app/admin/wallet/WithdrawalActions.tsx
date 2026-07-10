"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function WithdrawalActions({ id, kind }: { id: number; kind: "platform" | "client" }) {
  const router = useRouter()
  const [busy, setBusy] = useState<"complete" | "fail" | null>(null)

  const base = kind === "platform" ? `/api/admin/wallet/withdraw/${id}` : `/api/admin/client-withdrawals/${id}`

  async function act(action: "complete" | "fail") {
    if (action === "fail" && !confirm("Mark this withdrawal as failed? This cannot be undone.")) return
    setBusy(action)
    try {
      const res = await fetch(`${base}/${action}`, { method: "POST" })
      if (res.ok) router.refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex gap-2 justify-end">
      <button
        type="button"
        onClick={() => void act("complete")}
        disabled={busy !== null}
        className="text-xs font-medium text-success hover:underline disabled:opacity-50"
      >
        {busy === "complete" ? "…" : "Mark complete"}
      </button>
      <button
        type="button"
        onClick={() => void act("fail")}
        disabled={busy !== null}
        className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
      >
        {busy === "fail" ? "…" : "Mark failed"}
      </button>
    </div>
  )
}
