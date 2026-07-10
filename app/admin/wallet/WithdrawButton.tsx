"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Step = "amount" | "confirm" | "otp"

export function WithdrawButton({ available, processorFeeRate }: { available: number; processorFeeRate: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("amount")
  const [amount, setAmount] = useState("")
  const [code, setCode] = useState("")
  const [sendingCode, setSendingCode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedAmount = Number(amount)
  const isValid = amount.trim() !== "" && Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount <= available
  const isCodeValid = /^\d{6}$/.test(code)

  const processorFee = Math.round(parsedAmount * processorFeeRate)
  const netAmount = parsedAmount - processorFee

  function openModal() {
    setAmount("")
    setCode("")
    setError(null)
    setStep("amount")
    setOpen(true)
  }

  async function sendCode() {
    setSendingCode(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/wallet/withdraw/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? "Could not send verification code")
        return
      }
      setCode("")
      setStep("otp")
    } catch {
      setError("Network error — please try again")
    } finally {
      setSendingCode(false)
    }
  }

  async function submitWithdrawal() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount, code }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? "Could not submit withdrawal")
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button onClick={openModal} disabled={available <= 0}>Withdraw</Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            {step === "amount" && (
              <>
                <div>
                  <h2 className="font-semibold text-lg">Withdraw platform revenue</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Available: UGX {Math.round(available).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="withdraw-amount">Amount (UGX)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    min={1}
                    max={available}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    autoFocus
                  />
                </div>
                {isValid && (
                  <div className="text-xs text-muted-foreground bg-surface border border-border rounded-lg p-3 space-y-1">
                    <div className="flex justify-between">
                      <span>Pesapal transfer cost ({(processorFeeRate * 100).toFixed(0)}%)</span>
                      <span className="font-mono">UGX {processorFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium text-foreground pt-1 border-t border-border">
                      <span>Lands in Pesapal wallet</span>
                      <span className="font-mono">UGX {netAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={() => setStep("confirm")} disabled={!isValid}>Continue</Button>
                </div>
              </>
            )}

            {step === "confirm" && (
              <>
                <h2 className="font-semibold text-lg">Confirm withdrawal</h2>
                <p className="text-sm text-muted-foreground">
                  This records a pending withdrawal of{" "}
                  <span className="font-mono text-foreground">UGX {parsedAmount.toLocaleString()}</span>{" "}
                  to the main Pesapal wallet — after Pesapal&apos;s transfer cost, UGX {netAmount.toLocaleString()} lands
                  there. It does not send funds automatically yet — you fulfill it manually until the payout API
                  is wired in. The full amount is immediately reserved from the available balance. We&apos;ll
                  email a verification code to confirm it&apos;s really you.
                </p>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <Button variant="ghost" onClick={() => setStep("amount")} disabled={sendingCode}>Back</Button>
                  <Button onClick={() => void sendCode()} disabled={sendingCode}>
                    {sendingCode ? "Sending code…" : "Send code"}
                  </Button>
                </div>
              </>
            )}

            {step === "otp" && (
              <>
                <h2 className="font-semibold text-lg">Enter verification code</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to your email. Enter it to release this withdrawal request.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="withdraw-otp">Verification code</Label>
                  <Input
                    id="withdraw-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                    autoFocus
                  />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => void sendCode()}
                    disabled={sendingCode}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {sendingCode ? "Resending…" : "Resend code"}
                  </button>
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setStep("confirm")} disabled={saving}>Back</Button>
                    <Button onClick={() => void submitWithdrawal()} disabled={saving || !isCodeValid}>
                      {saving ? "Submitting…" : "Confirm withdrawal"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
