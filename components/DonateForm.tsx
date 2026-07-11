"use client"

import { useEffect, useState } from "react"
import { Loader2, Phone, CheckCircle2, XCircle, Smartphone, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const AMOUNTS = [2000, 5000, 10000, 20000, 50000]

interface DonateFormProps {
  username: string
  displayName: string
  fundraiserId?: number
}

type Step = "amount" | "pending" | "redirect" | "success" | "failed"
type PaymentMethod = "mobile_money" | "card"

export function DonateForm({ username, displayName, fundraiserId }: DonateFormProps) {
  const [amount, setAmount] = useState<number | "">("")
  const [customAmount, setCustomAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile_money")
  const [phone, setPhone] = useState("")
  const [donorName, setDonorName] = useState("")
  const [note, setNote] = useState("")
  const [step, setStep] = useState<Step>("amount")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  const resolvedAmount = amount !== "" ? amount : parseInt(customAmount.replace(/\D/g, ""), 10) || 0

  // Pesapal's checkout (embedded in the iframe below) posts a message up to
  // this window once the donation settles — see app/donate/complete.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type !== "sub-tree:donation-complete") return
      setStep(event.data.status === "COMPLETED" ? "success" : "failed")
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (resolvedAmount < 500) { setError("Minimum donation is UGX 500"); return }
    if (paymentMethod === "mobile_money" && !phone.trim()) { setError("Phone number is required"); return }

    navigator?.vibrate?.(20)
    setSubmitting(true)
    const referrerSource = sessionStorage.getItem("st_referrer") || undefined
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          amount: resolvedAmount,
          payment_method: paymentMethod,
          phone: paymentMethod === "mobile_money" ? phone.trim() : undefined,
          donor_name: donorName.trim() || undefined,
          note: note.trim() || undefined,
          referrer_source: referrerSource,
          fundraiser_id: fundraiserId,
        }),
      })

      if (!res.ok) {
        const body = (await res.json()) as { message?: string }
        setError(body.message ?? "Could not process payment. Please try again.")
        return
      }

      const body = (await res.json()) as { data: { idempotency_key: string; redirect_url?: string } }
      if (body.data.redirect_url) {
        setRedirectUrl(body.data.redirect_url)
        setStep("redirect")
      } else {
        setStep("pending")
      }
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
          Enter your PIN on your phone to complete the donation.
        </p>
        <Button variant="ghost" className="w-full" onClick={() => setStep("amount")}>
          Back
        </Button>
      </div>
    )
  }

  if (step === "redirect" && redirectUrl) {
    return (
      <div className="space-y-3">
        <iframe
          src={redirectUrl}
          title="Complete your payment"
          className="w-full h-[480px] rounded-lg border border-border"
        />
        <p className="text-xs text-center text-muted-foreground">
          Having trouble?{" "}
          <a href={redirectUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Open the payment page in a new tab
          </a>
        </p>
        <Button variant="ghost" className="w-full" onClick={() => setStep("amount")}>
          Back
        </Button>
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className="text-center space-y-3 py-4">
        <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
        <p className="font-medium">Thank you — your donation was received.</p>
      </div>
    )
  }

  if (step === "failed") {
    return (
      <div className="text-center space-y-4 py-4">
        <XCircle className="h-10 w-10 text-destructive mx-auto" />
        <div>
          <p className="font-medium">This payment didn&apos;t go through.</p>
          <p className="text-sm text-muted-foreground mt-1">You haven&apos;t been charged. Feel free to try again.</p>
        </div>
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
              onClick={() => { navigator?.vibrate?.(20); setAmount(a); setCustomAmount("") }}
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
        <Label className="text-sm font-medium">Pay with</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod("mobile_money")}
            className={[
              "flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg border transition-colors duration-150",
              paymentMethod === "mobile_money"
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground/30",
            ].join(" ")}
          >
            <Smartphone className="h-4 w-4" />
            Mobile money
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("card")}
            className={[
              "flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg border transition-colors duration-150",
              paymentMethod === "card"
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground/30",
            ].join(" ")}
          >
            <CreditCard className="h-4 w-4" />
            Card
          </button>
        </div>
      </div>

      {paymentMethod === "mobile_money" ? (
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
      ) : (
        <p className="text-xs text-muted-foreground">
          You&apos;ll enter your Visa or Mastercard details securely on the next screen.
        </p>
      )}

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
        {paymentMethod === "mobile_money"
          ? `Payments go directly to ${displayName} via MTN MoMo or Airtel Money.`
          : `Card payments to ${displayName} are processed securely by Pesapal.`}
      </p>
    </form>
  )
}
