"use client"

import { useState } from "react"
import { Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface MomoNumberVerifyProps {
  initialVerifiedNumber?: string | null
}

export function MomoNumberVerify({ initialVerifiedNumber }: MomoNumberVerifyProps) {
  const [phone, setPhone] = useState("")
  const [step, setStep] = useState<"phone" | "code" | "done">(initialVerifiedNumber ? "done" : "phone")
  const [verifiedNumber, setVerifiedNumber] = useState(initialVerifiedNumber ?? "")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/onboarding/momo-number/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.message ?? "Could not send code")
        return
      }
      setStep("code")
    } catch {
      setError("Could not send code — please try again")
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/onboarding/momo-number/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.message ?? "Invalid code")
        return
      }
      setVerifiedNumber(phone)
      setStep("done")
    } catch {
      setError("Could not verify code — please try again")
    } finally {
      setLoading(false)
    }
  }

  if (step === "done") {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-bg text-success shrink-0">
            <Check className="h-3 w-3" />
          </span>
          <span className="text-sm font-mono">{verifiedNumber}</span>
        </div>
        <button
          type="button"
          onClick={() => { setStep("phone"); setPhone(""); setCode(""); setError(null) }}
          className="text-xs text-muted-foreground hover:underline"
        >
          Change
        </button>
      </div>
    )
  }

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Code sent to {phone}. <button type="button" onClick={() => setStep("phone")} className="underline">Change number</button>
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="text-center text-lg tracking-[0.4em] font-mono"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <Button type="submit" disabled={loading || code.length < 6}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </form>
    )
  }

  return (
    <form onSubmit={sendCode} className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="tel"
          placeholder="0771234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Button type="submit" disabled={loading || !phone}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  )
}
