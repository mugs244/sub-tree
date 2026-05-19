"use client"

import { useState } from "react"
import { Loader2, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const AMOUNTS = [2000, 5000, 10000, 20000, 50000]

interface DonateFormProps {
  username: string
  displayName: string
}

type Step = "amount" | "pending" | "success" | "failed"

export function DonateForm({ username, displayName }: DonateFormProps) {
  const [amount, setAmount] = useState<number | "">("")
  const [customAmount, setCustomAmount] = useState("")
  const [phone, setPhone] = useState("")
  const [donorName, setDonorName] = useState("")
  const [note, setNote] = useState("")
  const [step, setStep] = useState<Step>("amount")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedAmount = amount !== "" ? amount : parseInt(customAmount.replace(/\D/g, ""), 10) || 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (resolvedAmount < 500) { setError("Minimum donation is UGX 500"); return }
    if (!phone.trim()) { setError("Phone number is required"); return }

    setSubmitting(true)
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          amount: resolvedAmount,
          phone: phone.trim(),
          donor_name: donorName.trim() || undefined,
          note: note.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const body = (await res.json()) as { message?: string }
        setError(body.message ?? "Could not process payment. Please try again.")
        return
      }

      setStep("pending")
    } catch {
      setError("Could not connect to payment service. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (step === "pending") {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-surface border border-border flex items-center justify-center">
            <Phone className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        <div>
          <p className="font-medium">Check your phone</p>
          <p className="text-sm text-muted-foreground mt-1">
            A payment prompt has been sent to <span className="font-mono">{phone}</span>. Approve it to complete your donation.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Mobile money integration coming soon — this is a preview.
        </p>
        <Button variant="ghost" className="w-full" onClick={() => setStep("amount")}>
          Back
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-3">
        <Label className="text-sm font-medium">Amount (UGX)</Label>
        <div className="grid grid-cols-3 gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { setAmount(a); setCustomAmount("") }}
              className={[
                "py-2 text-sm font-medium rounded-lg border transition-colors duration-150",
                amount === a
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground/30",
              ].join(" ")}
            >
              {a.toLocaleString()}
            </button>
          ))}
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Other"
            value={customAmount}
            onChange={(e) => { setCustomAmount(e.target.value.replace(/\D/g, "")); setAmount("") }}
            className="col-span-1 text-center"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-sm font-medium">
          Mobile money number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="07XX XXX XXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">MTN or Airtel Uganda</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="donor-name" className="text-sm font-medium">
          Your name <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="donor-name"
          type="text"
          placeholder="Anonymous"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note" className="text-sm font-medium">
          Note <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="note"
          type="text"
          placeholder={`Keep up the great work, ${displayName}!`}
          maxLength={120}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={submitting || resolvedAmount < 500}>
        {submitting ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing…</>
        ) : (
          `Donate UGX ${resolvedAmount > 0 ? resolvedAmount.toLocaleString() : "—"}`
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Payments go directly to {displayName} via MTN MoMo or Airtel Money.
      </p>
    </form>
  )
}
