"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"

type Tier = "FREE" | "PRO" | "BUSINESS" | "CONTENT_HOUSE"

interface Plan {
  id: Tier
  name: string
  price: string
  period: string
  description: string
  badge: string | null
  features: { label: string; included: boolean }[]
  cta: string
  href: string | null // null = use payment flow
}

const PLANS: Plan[] = [
  {
    id: "FREE",
    name: "Free",
    price: "UGX 0",
    period: "forever",
    description: "Get started with a simple link page.",
    badge: null,
    features: [
      { label: "1 link page", included: true },
      { label: "5 links", included: true },
      { label: "Basic analytics", included: true },
      { label: "Custom domain", included: false },
      { label: "Team members", included: false },
      { label: "Donation splits", included: false },
    ],
    cta: "Continue free",
    href: "/dashboard",
  },
  {
    id: "PRO",
    name: "Pro",
    price: "UGX 15,000",
    period: "/mo",
    description: "For creators who want more reach.",
    badge: "5-day free trial",
    features: [
      { label: "Unlimited links", included: true },
      { label: "Custom domain", included: true },
      { label: "Advanced analytics", included: true },
      { label: "Priority support", included: true },
      { label: "Team members", included: false },
      { label: "Donation splits", included: false },
    ],
    cta: "Start free trial",
    href: null,
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: "UGX 40,000",
    period: "/mo",
    description: "For teams and organisations.",
    badge: "5-day free trial",
    features: [
      { label: "Everything in Pro", included: true },
      { label: "Up to 5 team members", included: true },
      { label: "Shared dashboard", included: true },
      { label: "Priority support", included: true },
      { label: "Donation splits", included: false },
      { label: "Multi-member accounts", included: false },
    ],
    cta: "Start free trial",
    href: null,
  },
  {
    id: "CONTENT_HOUSE",
    name: "Content House",
    price: "UGX 80,000",
    period: "/mo",
    description: "For multi-creator content studios.",
    badge: "5-day free trial",
    features: [
      { label: "Everything in Business", included: true },
      { label: "Up to 10 members", included: true },
      { label: "Donation splits by share rate", included: true },
      { label: "Setup via admin review", included: true },
      { label: "Dedicated onboarding", included: true },
      { label: "Priority support", included: true },
    ],
    cta: "Talk to us",
    href: "/content-house",
  },
]

function normalise(cookieVal: string | null): Tier {
  const map: Record<string, Tier> = {
    pro: "PRO",
    business: "BUSINESS",
    content_house: "CONTENT_HOUSE",
    free: "FREE",
  }
  return (cookieVal ? map[cookieVal.toLowerCase()] : undefined) ?? "FREE"
}

export function PlanPicker({ preselected }: { preselected: string | null }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Tier>(normalise(preselected))
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    const plan = PLANS.find((p) => p.id === selected)!
    setLoading(true)
    if (plan.href) {
      router.push(plan.href)
      return
    }
    // PRO and BUSINESS start a free trial immediately — no payment required
    const res = await fetch("/api/onboarding/start-trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: selected }),
    })
    if (res.ok) {
      router.push("/dashboard")
    } else {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLANS.map((plan) => {
          const active = selected === plan.id
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelected(plan.id)}
              className={[
                "relative text-left rounded-xl border p-5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] cursor-pointer",
                active
                  ? "border-[color:var(--accent)] bg-[color:var(--accent)]/5 shadow-sm"
                  : "border-[color:var(--border-default)] bg-[color:var(--bg-raised)] hover:border-[color:var(--border-strong)]",
              ].join(" ")}
              aria-pressed={active}
            >
              {plan.badge && (
                <span className="absolute top-4 right-4 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[color:var(--accent)]/15 text-[color:var(--accent)]">
                  {plan.badge}
                </span>
              )}

              <div className="space-y-1 mb-4">
                <p className="text-[13px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">
                  {plan.name}
                </p>
                <p className="text-2xl font-semibold tracking-tight">
                  {plan.price}
                  <span className="text-sm font-normal text-[color:var(--text-muted)] ml-0.5">
                    {plan.period}
                  </span>
                </p>
                <p className="text-[13px] text-[color:var(--text-secondary)]">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-[13px]">
                    {f.included ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 shrink-0 text-[color:var(--text-muted)]" />
                    )}
                    <span className={f.included ? "" : "text-[color:var(--text-muted)]"}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {active && (
                <span className="absolute top-4 left-4 h-2 w-2 rounded-full bg-[color:var(--accent)]" />
              )}
            </button>
          )
        })}
      </div>

      <Button
        className="w-full"
        onClick={() => void handleContinue()}
        disabled={loading}
      >
        {loading ? "Continuing…" : PLANS.find((p) => p.id === selected)?.cta ?? "Continue"}
      </Button>

      <p className="text-xs text-center text-[color:var(--text-muted)]">
        You can change your plan at any time from your dashboard.
      </p>
    </div>
  )
}
