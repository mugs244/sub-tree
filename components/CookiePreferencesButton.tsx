"use client"

import { clearConsent } from "@/lib/cookie-consent"

export function CookiePreferencesButton({
  className = "underline underline-offset-4",
  children = "reopen the cookie banner",
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <button type="button" onClick={() => clearConsent()} className={className}>
      {children}
    </button>
  )
}
