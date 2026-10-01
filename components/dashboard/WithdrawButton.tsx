"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowUpRight } from "lucide-react"

type Step = "amount" | "confirm" | "otp"

// Shortcut amounts as a share of the available balance.
const QUICK_PICKS = [0.25, 0.5, 1] as const

export function WithdrawButton({
  available,
  creatorFeeRate,
  processorFeeRate,
}: {
  available: number
  creatorFeeRate: number
  processorFeeRate: number
}) {
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

  const platformFee = Math.round(parsedAmount * creatorFeeRate)
  const processorFee = Math.round(parsedAmount * processorFeeRate)
  const netAmount = parsedAmount - platformFee - processorFee

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
      const res = await fetch("/api/wallet/withdraw/send-otp", {
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
      const res = await fetch("/api/wallet/withdraw", {
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
      <button
        type="button"
        onClick={openModal}
        disabled={available <= 0}
        className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ff8a3d] px-5 text-sm font-semibold text-[#111827] shadow-[0_6px_20px_rgba(255,138,61,0.35)] transition-[transform,filter] duration-150 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
        Withdraw
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !saving && !sendingCode) setOpen(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdraw-title"
            className="w-full max-w-md space-y-5 rounded-t-3xl border border-border bg-card p-6 pb-8 text-foreground shadow-2xl sm:rounded-3xl sm:pb-6"
          >
            <div className="mx-auto -mt-2 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />

            {step === "amount" && (
              <>
                <div>
                  <h2 id="withdraw-title" className="text-xl font-bold tracking-tight">Withdraw to mobile money</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Available <span className="font-mono font-medium text-foreground">UGX {Math.round(available).toLocaleString()}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount" className="text-xs text-muted-foreground">Amount (UGX)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={available}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    autoFocus
                    className="h-14 rounded-2xl border-border bg-surface text-2xl font-semibold tabular-nums"
                  />
                  <div className="flex gap-2">
                    {QUICK_PICKS.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setAmount(String(Math.floor(available * pct)))}
                        disabled={available <= 0}
                        className="flex-1 rounded-xl border border-border bg-surface py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-[#ff8a3d] hover:text-foreground"
                      >
                        {pct === 1 ? "Max" : `${pct * 100}%`}
                      </button>
                    ))}
                  </div>
                </div>
                {isValid && (
                  <div className="space-y-1.5 rounded-2xl bg-surface p-4 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Sub-tree fee ({(creatorFeeRate * 100).toFixed(0)}%)</span>
                      <span className="font-mono">UGX {platformFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transfer cost ({(processorFeeRate * 100).toFixed(0)}%)</span>
                      <span className="font-mono">UGX {processorFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold text-foreground">
                      <span>You&apos;ll receive</span>
                      <span className="font-mono">UGX {netAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex gap-3">
                  <Button variant="outline" className="h-12 flex-1 rounded-2xl" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button className="h-12 flex-1 rounded-2xl font-semibold" onClick={() => setStep("confirm")} disabled={!isValid}>Continue</Button>
                </div>
              </>
            )}

            {step === "confirm" && (
              <>
                <h2 id="withdraw-title" className="text-xl font-bold tracking-tight">Confirm withdrawal</h2>
                <div className="rounded-2xl bg-surface p-4 text-center">
                  <p className="text-xs text-muted-foreground">You&apos;ll receive</p>
                  <p className="mt-1 font-mono text-3xl font-bold tracking-tight">UGX {netAmount.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-muted-foreground">from UGX {parsedAmount.toLocaleString()} withdrawn</p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  This records a pending withdrawal. It doesn&apos;t send funds automatically yet — the Sub-tree team
                  sends it to your registered mobile money number until automatic payouts are enabled. The full amount
                  is reserved from your balance straight away. We&apos;ll email you a code to confirm it&apos;s you.
                </p>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex gap-3">
                  <Button variant="outline" className="h-12 flex-1 rounded-2xl" onClick={() => setStep("amount")} disabled={sendingCode}>Back</Button>
                  <Button className="h-12 flex-1 rounded-2xl font-semibold" onClick={() => void sendCode()} disabled={sendingCode}>
                    {sendingCode ? "Sending code…" : "Send code"}
                  </Button>
                </div>
              </>
            )}

            {step === "otp" && (
              <>
                <div>
                  <h2 id="withdraw-title" className="text-xl font-bold tracking-tight">Enter verification code</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We sent a 6-digit code to your email. Enter it to release this withdrawal.
                  </p>
                </div>
                <Input
                  id="withdraw-otp"
                  aria-label="Verification code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="h-14 rounded-2xl border-border bg-surface text-center font-mono text-2xl tracking-[0.5em]"
                  autoFocus
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex gap-3">
                  <Button variant="outline" className="h-12 flex-1 rounded-2xl" onClick={() => setStep("confirm")} disabled={saving}>Back</Button>
                  <Button className="h-12 flex-1 rounded-2xl font-semibold" onClick={() => void submitWithdrawal()} disabled={saving || !isCodeValid}>
                    {saving ? "Submitting…" : "Confirm"}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => void sendCode()}
                  disabled={sendingCode}
                  className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  {sendingCode ? "Resending…" : "Didn't get it? Resend code"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
