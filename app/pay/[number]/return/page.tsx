"use client"

import { Suspense, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"

// Pesapal sends its checkout here (inside the Sub-pay iframe) when payment
// finishes. Hand the result to the full Sub-pay page, outside the iframe.
function Return() {
  const { number } = useParams<{ number: string }>()
  const search = useSearchParams()

  useEffect(() => {
    const tracking = search.get("OrderTrackingId") ?? search.get("orderTrackingId") ?? ""
    const target = `/pay/${number}${tracking ? `?tracking=${encodeURIComponent(tracking)}` : ""}`
    if (window.top && window.top !== window.self) window.top.location.href = target
    else window.location.replace(target)
  }, [number, search])

  return <p style={{ fontFamily: "sans-serif", textAlign: "center", padding: 40, color: "#6b7280" }}>Finishing your payment…</p>
}

export default function PesapalReturn() {
  return (
    <Suspense>
      <Return />
    </Suspense>
  )
}
