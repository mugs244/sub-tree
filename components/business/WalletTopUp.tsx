"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Manual top-up until real MoMo/Pesapal collection is wired in for
// advertisers (see lib/services/advertiser-wallet.ts).
export function WalletTopUp() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedAmount = Number(amount)
  const isValid = amount.trim() !== "" && Number.isFinite(parsedAmount) && parsedAmount > 0

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/business/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUgx: parsedAmount }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? "Could not top up the wallet")
        return
      }
      setOpen(false)
      setAmount("")
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg">Top up wallet</Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <h2 className="font-semibold text-lg">Top up wallet</h2>
            <p className="text-sm text-muted-foreground">
              Manual top-up for now — mobile money collection for advertisers isn&apos;t wired in yet.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="topup-amount">Amount (UGX)</Label>
              <Input
                id="topup-amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={() => void submit()} disabled={saving || !isValid}>
                {saving ? "Adding…" : "Add funds"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
