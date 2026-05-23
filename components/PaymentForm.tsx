"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Tier = "PRO" | "BUSINESS" | "CONTENT_HOUSE"

const TIER_LABELS: Record<Tier, string> = {
  PRO: "Pro",
  BUSINESS: "Business",
  CONTENT_HOUSE: "Content House",
}

const TIER_PRICES: Record<Tier, string> = {
  PRO: "UGX 15,000",
  BUSINESS: "UGX 40,000",
  CONTENT_HOUSE: "UGX 80,000",
}

const TRIAL_TIERS: Tier[] = ["BUSINESS", "CONTENT_HOUSE"]

type Stage = "input" | "pending" | "success" | "failed"

export function PaymentForm({ tier }: { tier: Tier }) {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>("input")
  const [serverError, setServerError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isTrial = TRIAL_TIERS.includes(tier)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/subscriptions/status")
        if (!res.ok) return
        const data = (await res.json()) as {
          tier: string
          subscription: { status: string } | null
        }
        if (data.tier !== "FREE") {
          clearInterval(pollRef.current!)
          setStage("success")
          setTimeout(() => router.push("/dashboard"), 2000)
        } else if (data.subscription?.status === "PAST_DUE") {
          clearInterval(pollRef.current!)
          setStage("failed")
        }
      } catch {
        // network blip — keep polling
      }
    }, 3000)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPhoneError(null)
    setServerError(null)

    const cleaned = phone.replace(/\s/g, "")
    if (!/^0[0-9]{9}$/.test(cleaned)) {
      setPhoneError("Enter a valid Ugandan number (07XXXXXXXX)")
      return
    }

    setStage("pending")
    try {
      const res = await fetch("/api/subscriptions/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, phone: cleaned }),
      })
      const body = (await res.json()) as { status?: string; error?: string }

      if (!res.ok) {
        setStage("input")
        setServerError(body.error ?? "Something went wrong — please try again")
        return
      }

      // Trial tiers go straight through — user.tier is updated immediately
      if (body.status === "TRIALING" && isTrial) {
        setStage("success")
        setTimeout(() => router.push("/dashboard"), 2000)
        return
      }

      // Non-trial: wait for STK webhook
      startPolling()
    } catch {
      setStage("input")
      setServerError("Could not reach the server — please try again")
    }
  }

  if (stage === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-[color:var(--accent)]" />
        <div className="space-y-1">
          <p className="font-semibold text-lg">
            {isTrial ? "Your free trial has started" : "Payment confirmed"}
          </p>
          <p className="text-sm text-[color:var(--text-secondary)]">
            {isTrial
              ? `You have 5 days free on ${TIER_LABELS[tier]}. We'll send you a payment request before your trial ends.`
              : `Welcome to ${TIER_LABELS[tier]}. Redirecting you to your dashboard.`}
          </p>
        </div>
      </div>
    )
  }

  if (stage === "failed") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <XCircle className="h-12 w-12 text-[color:var(--state-error)]" />
        <div className="space-y-1">
          <p className="font-semibold text-lg">Payment not completed</p>
          <p className="text-sm text-[color:var(--text-secondary)]">
            The Mobile Money request was declined or timed out.
          </p>
        </div>
        <Button variant="outline" onClick={() => setStage("input")}>
          Try again
        </Button>
      </div>
    )
  }

  if (stage === "pending") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[color:var(--accent)]" />
        <div className="space-y-1">
          <p className="font-semibold">Check your phone</p>
          <p className="text-sm text-[color:var(--text-secondary)]">
            A Mobile Money prompt has been sent to <strong>{phone}</strong>.
            Approve it to continue.
          </p>
        </div>
        <p className="text-xs text-[color:var(--text-muted)] mt-2">
          This page will update automatically once the payment is confirmed.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg bg-[color:var(--bg-surface)] border border-[color:var(--border-default)] px-4 py-3 flex items-center justify-between text-sm">
        <span className="text-[color:var(--text-secondary)]">
          {TIER_LABELS[tier]} plan
          {isTrial && (
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-[color:var(--accent)]/15 text-[color:var(--accent)] font-medium">
              5-day free trial
            </span>
          )}
        </span>
        <span className="font-semibold">{TIER_PRICES[tier]}/mo</span>
      </div>

      {isTrial && (
        <p className="text-[13px] text-[color:var(--text-secondary)] bg-[color:var(--bg-raised)] border border-[color:var(--border-default)] rounded-lg px-4 py-3">
          Your trial starts immediately. After 5 days we will send a Mobile Money
          request to collect your first payment. You can cancel anytime before then.
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="momo_phone" className="text-sm font-medium">
          Mobile Money number <span className="text-[color:var(--state-error)]">*</span>
        </Label>
        <Input
          id="momo_phone"
          type="tel"
          placeholder="07XXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={phoneError ? "border-[color:var(--state-error)] focus-visible:ring-[color:var(--state-error)]/20" : ""}
        />
        <div className="min-h-[18px]">
          {phoneError && (
            <p className="text-xs text-[color:var(--state-error)]">{phoneError}</p>
          )}
        </div>
      </div>

      {serverError && (
        <p className="text-xs text-[color:var(--state-error)]">{serverError}</p>
      )}

      <Button type="submit" className="w-full">
        {isTrial ? "Start free trial" : "Send payment request"}
      </Button>

      <p className="text-xs text-center text-[color:var(--text-muted)]">
        Payments are processed securely via Mobile Money. No card required.
      </p>
    </form>
  )
}
