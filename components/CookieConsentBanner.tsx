"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getConsent, setConsent, onConsentChange } from "@/lib/cookie-consent"

// Scroll slack — the last pixel or two of a scrollable box can be hard to
// reach exactly on some trackpads/zoom levels, so treat "close enough" as done.
const SCROLL_END_SLACK = 8

export function CookieConsentBanner() {
  const [open, setOpen] = useState(false)
  const [canDecide, setCanDecide] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sync = () => {
      const shouldOpen = getConsent() === null
      setOpen(shouldOpen)
      // Re-opening (e.g. via "Cookie preferences") must require reading again —
      // this component stays mounted, so state from a prior open would linger.
      if (shouldOpen) setCanDecide(false)
    }
    sync()
    return onConsentChange(sync)
  }, [])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_END_SLACK) {
      setCanDecide(true)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-background border border-border rounded-xl shadow-lg flex flex-col max-h-[85vh]">
        <div className="px-5 pt-5 pb-3 border-b border-border">
          <h2 className="text-lg font-semibold tracking-tight">Cookies on Sub-tree</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Please read the full notice below before accepting or declining.
          </p>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="px-5 py-4 overflow-y-auto space-y-4 text-sm leading-relaxed h-48"
        >
          <p>
            Sub-tree uses a small number of cookies and similar technologies. Read the full{" "}
            <Link href="/cookies" target="_blank" className="underline underline-offset-4">
              Cookie Policy
            </Link>{" "}
            for details. In summary:
          </p>

          <div>
            <p className="font-medium">Strictly necessary</p>
            <p className="text-muted-foreground">
              A session cookie keeps you signed in, and a short-lived cookie remembers your plan selection during
              sign-up. The Platform cannot work without these, so they are always on and are not subject to your
              choice below.
            </p>
          </div>

          <div>
            <p className="font-medium">Analytics</p>
            <p className="text-muted-foreground">
              With your consent, we use Vercel Web Analytics to understand traffic to the Platform (pages visited,
              approximate location, device type). This is cookieless — it does not set a cookie or store an
              identifier on your device — but we ask for consent before enabling it, since it still involves
              collecting usage data.
            </p>
          </div>

          <div>
            <p className="font-medium">Third parties</p>
            <p className="text-muted-foreground">
              Our payment partners (Pesapal / OpenFloat) may set their own cookies during checkout, governed by
              their own policies, regardless of your choice here.
            </p>
          </div>

          <p className="text-muted-foreground">
            You can change your choice at any time from the &ldquo;Cookie preferences&rdquo; link in the site
            footer.
          </p>
        </div>

        <div className="px-5 py-4 border-t border-border space-y-2">
          {!canDecide && (
            <p className="text-xs text-muted-foreground text-center">Scroll down to read the full notice</p>
          )}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              disabled={!canDecide}
              onClick={() => setConsent("denied")}
            >
              Decline
            </Button>
            <Button disabled={!canDecide} onClick={() => setConsent("accepted")}>
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
