"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

type Status = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REVERSED"

const isSettled = (s: Status) => s === "COMPLETED" || s === "FAILED" || s === "REVERSED"

// Polls our own donation record (kept fresh by the Pesapal IPN webhook,
// independent of this page) until it settles. If this page is loaded inside
// the checkout iframe on the donate page, also posts the result up to the
// parent window so DonateForm can react immediately instead of waiting for
// the donor to notice this page themselves.
export function DonationStatusClient({ donationRef, initialStatus }: { donationRef: string; initialStatus: Status }) {
  const [status, setStatus] = useState<Status>(initialStatus)

  useEffect(() => {
    if (isSettled(status)) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/public/donations/status?ref=${encodeURIComponent(donationRef)}`)
        if (!res.ok) return
        const { data } = (await res.json()) as { data: { status: Status } }
        setStatus(data.status)
      } catch {
        // keep polling — a transient network error shouldn't stop the check
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [donationRef, status])

  useEffect(() => {
    if (!isSettled(status)) return
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "sub-tree:donation-complete", status }, "*")
    }
  }, [status])

  if (status === "COMPLETED") {
    return (
      <div className="text-center space-y-3">
        <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
        <p className="font-medium">Thank you — your donation was received.</p>
      </div>
    )
  }

  if (status === "FAILED" || status === "REVERSED") {
    return (
      <div className="text-center space-y-3">
        <XCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="font-medium">This payment didn&apos;t go through.</p>
        <p className="text-sm text-muted-foreground">You haven&apos;t been charged. Feel free to try again.</p>
      </div>
    )
  }

  return (
    <div className="text-center space-y-3">
      <Loader2 className="h-10 w-10 text-muted-foreground mx-auto animate-spin" />
      <p className="font-medium">Confirming your payment…</p>
      <p className="text-sm text-muted-foreground">This usually takes a few seconds.</p>
    </div>
  )
}
