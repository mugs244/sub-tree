"use client"

import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"
import { getConsent, onConsentChange } from "@/lib/cookie-consent"

export function ConditionalAnalytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const sync = () => setEnabled(getConsent() === "accepted")
    sync()
    return onConsentChange(sync)
  }, [])

  if (!enabled) return null
  return <Analytics />
}
