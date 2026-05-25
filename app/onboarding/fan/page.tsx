"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function FanOnboardingPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading")

  useEffect(() => {
    async function complete() {
      try {
        const res = await fetch("/api/onboarding/complete-fan", { method: "POST" })
        if (!res.ok) throw new Error("Failed")
        const { redirect } = await res.json() as { redirect: string }
        setStatus("done")
        router.push(redirect)
      } catch {
        setStatus("error")
      }
    }
    complete()
  }, [router])

  if (status === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Something went wrong setting up your profile.</p>
          <button
            onClick={() => { setStatus("loading"); void (async () => { const res = await fetch("/api/onboarding/complete-fan", { method: "POST" }); if (res.ok) { const { redirect } = await res.json() as { redirect: string }; router.push(redirect) } })() }}
            className="text-xs underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">
          {status === "done" ? "All set! Redirecting…" : "Setting up your fan profile…"}
        </p>
      </div>
    </main>
  )
}
