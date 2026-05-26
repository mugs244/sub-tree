"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function DevBypassButton({ tier }: { tier: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function bypass() {
    setLoading(true)
    const res = await fetch("/api/dev/bypass-tier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    })
    if (res.ok) {
      router.push("/dashboard")
    } else {
      setLoading(false)
    }
  }

  return (
    <p className="text-xs text-center">
      <button
        onClick={() => void bypass()}
        disabled={loading}
        className="text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50"
      >
        {loading ? "Activating…" : "Skip payment (dev)"}
      </button>
    </p>
  )
}
