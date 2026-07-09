"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function WithdrawButton({ available }: { available: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedAmount = Number(amount)
  const isValid = amount.trim() !== "" && Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount <= available

  function openModal() {
    setAmount("")
    setError(null)
    setConfirming(false)
    setOpen(true)
  }

  async function submitWithdrawal() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? "Could not submit withdrawal")
        setConfirming(false)
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError("Network error — please try again")
      setConfirming(false)
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
            {!confirming ? (
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
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={() => setConfirming(true)} disabled={!isValid}>Continue</Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-semibold text-lg">Confirm withdrawal</h2>
                <p className="text-sm text-muted-foreground">
                  This records a pending withdrawal of{" "}
                  <span className="font-mono text-foreground">UGX {parsedAmount.toLocaleString()}</span>{" "}
                  to the main Pesapal wallet. It does not send funds automatically yet — you fulfill it manually
                  until the payout API is wired in. This amount is immediately reserved from the available balance.
                </p>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <Button variant="ghost" onClick={() => setConfirming(false)} disabled={saving}>Back</Button>
                  <Button onClick={() => void submitWithdrawal()} disabled={saving}>
                    {saving ? "Submitting…" : "Confirm withdrawal"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
