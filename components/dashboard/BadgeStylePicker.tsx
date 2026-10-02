"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { VerifiedBadge, BADGE_STYLES, type BadgeStyle } from "@/components/VerifiedBadge"

// Pick the badge shown next to your name. Saves straight away; the parent
// gets the new value so every badge on the screen updates with it.
export function BadgeStylePicker({ value, onChange }: { value: BadgeStyle; onChange: (style: BadgeStyle) => void }) {
  const [error, setError] = useState<string | null>(null)

  async function choose(style: BadgeStyle) {
    if (style === value) return
    const previous = value
    onChange(style)
    setError(null)
    try {
      const res = await fetch("/api/verification/badge-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style }),
      })
      if (!res.ok) throw new Error()
    } catch {
      onChange(previous)
      setError("Couldn't save your badge choice — please try again")
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold">Choose your badge</p>
      <div className="mt-2 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Badge style">
        {BADGE_STYLES.map((s) => {
          const active = value === s.value
          return (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => void choose(s.value)}
              className={[
                "relative flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 transition-colors",
                active ? "border-[#ff8a3d] bg-[color:var(--dash-orange-soft)]" : "border-border bg-card hover:border-foreground/20",
              ].join(" ")}
            >
              {active && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff8a3d] text-[#111827]">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
              <VerifiedBadge variant={s.value} size={40} />
              <span className="text-sm font-semibold">{s.label}</span>
            </button>
          )
        })}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
