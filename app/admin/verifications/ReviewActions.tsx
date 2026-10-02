"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

// Approve / reject a verification that Smile ID flagged for review.
export function ReviewActions({ id }: { id: number }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function decide(approve: boolean) {
    if (!approve && !confirm("Reject this verification? The creator will be emailed and can retry if they have tries left.")) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      })
      if (res.ok) router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex justify-end gap-3">
      <button type="button" disabled={busy} onClick={() => void decide(true)} className="text-xs font-semibold text-success hover:underline disabled:opacity-50">
        Approve
      </button>
      <button type="button" disabled={busy} onClick={() => void decide(false)} className="text-xs font-semibold text-destructive hover:underline disabled:opacity-50">
        Reject
      </button>
    </div>
  )
}
