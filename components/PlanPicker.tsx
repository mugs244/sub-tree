"use client"

import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const FREE_FEATURES = [
  "1 link page",
  "Unlimited links",
  "Basic analytics",
  "Donations via MoMo",
  "5 theme presets",
]

export function PlanPicker({ preselected: _ }: { preselected: string | null }) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[color:var(--accent)] bg-[color:var(--accent)]/5 p-5 shadow-sm">
        <div className="space-y-1 mb-4">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">Free</p>
          <p className="text-2xl font-semibold tracking-tight">
            UGX 0
            <span className="text-sm font-normal text-[color:var(--text-muted)] ml-0.5">forever</span>
          </p>
          <p className="text-[13px] text-[color:var(--text-secondary)]">Get started with a simple link page.</p>
        </div>
        <ul className="space-y-1.5">
          {FREE_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-[13px]">
              <Check className="h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <Button className="w-full" onClick={() => router.push("/dashboard")}>
        Continue free
      </Button>

      <p className="text-xs text-center text-[color:var(--text-muted)]">
        Free to use. No credit card required.
      </p>
    </div>
  )
}
