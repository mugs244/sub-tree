"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { AddLinkPanel } from "@/components/AddLinkPanel"
import { PlatformIcon } from "@/components/PlatformIcon"
import { authButtonClass } from "@/components/auth/AuthShell"
import { detectPlatform } from "@/lib/utils/platform"
import type { ConnectProvider } from "@/lib/platform-catalog"

// Onboarding step 3: the same platform picker as Dashboard → Links, so
// creators add their first links the way they'll keep adding them.
export function OnboardingLinks({ connectProviders }: { connectProviders: ConnectProvider[] }) {
  const router = useRouter()
  const [added, setAdded] = useState<{ url: string; label: string }[]>([])

  async function add(url: string, label: string): Promise<string | null> {
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, label }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string }
        return body.message ?? "Could not add link"
      }
      setAdded((cur) => [...cur, { url, label }])
      return null
    } catch {
      return "Could not add link — please try again"
    }
  }

  return (
    <div className="space-y-5">
      {added.length > 0 && (
        <ul className="space-y-2">
          {added.map((l) => (
            <li key={l.url} className="flex items-center gap-3 rounded-xl border-2 border-foreground/10 bg-white px-3 py-2.5">
              <PlatformIcon platform={detectPlatform(l.url)} className="h-5 w-5 shrink-0" colored />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{l.label}</span>
                <span className="block truncate font-mono text-xs text-muted-foreground">{l.url}</span>
              </span>
              <Check className="h-4 w-4 text-success" />
            </li>
          ))}
        </ul>
      )}

      <AddLinkPanel connectProviders={connectProviders} onAdd={add} />

      <div className="space-y-2">
        {added.length > 0 && (
          <button type="button" onClick={() => router.push("/dashboard")} className={authButtonClass}>
            Continue to your dashboard
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {added.length > 0 ? "I'll add more later" : "Skip for now"}
        </button>
      </div>
    </div>
  )
}
