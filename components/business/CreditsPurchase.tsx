"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Layers } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CreditsPurchase({
  plan,
  canBuy,
  walletBalanceUgx,
  planCap,
  purchased,
  effectiveCap,
  unitPrice,
  remaining,
}: {
  plan: "STARTUP" | "GROWTH" | "ENTERPRISE"
  canBuy: boolean
  walletBalanceUgx: string
  planCap: number
  purchased: number
  effectiveCap: number
  unitPrice: number
  remaining: number
}) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const balance = Number(walletBalanceUgx)
  const charge = unitPrice * quantity
  const canAfford = balance >= charge
  const clampedMax = Math.max(1, remaining)

  async function buy() {
    setBuying(true)
    setError(null)
    try {
      const res = await fetch("/api/business/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? "Could not buy credits")
        return
      }
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setBuying(false)
    }
  }

  return (
    <div className="px-4 py-5 md:p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Credits</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Buy additional concurrent ad-slot caps beyond your {plan.charAt(0) + plan.slice(1).toLowerCase()} plan.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background border border-border">
            <Layers className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Your concurrent slot cap</p>
            <p className="text-3xl font-semibold tracking-tight">{effectiveCap}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {planCap} from your plan{purchased > 0 ? ` + ${purchased} purchased` : ""}
            </p>
          </div>
        </div>
      </div>

      {canBuy ? (
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 space-y-4">
          <h2 className="text-sm font-medium">Buy additional caps</h2>
          {remaining <= 0 ? (
            <p className="text-sm text-muted-foreground">
              You&apos;ve reached the maximum additional caps for now. Additional capacity opens up as the platform grows.
            </p>
          ) : (
            <>
              <div className="flex items-end gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="qty" className="text-sm font-medium">How many</label>
                  <input
                    id="qty"
                    type="number"
                    min={1}
                    max={clampedMax}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(clampedMax, Number(e.target.value) || 1)))}
                    className="w-24 h-10 rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
                <div className="text-sm text-muted-foreground pb-2.5">
                  × UGX {unitPrice.toLocaleString()} = <span className="font-medium text-foreground">UGX {charge.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {remaining} more available to buy · deducted from your wallet (UGX {balance.toLocaleString()})
              </p>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button onClick={() => void buy()} disabled={buying || !canAfford}>
                {buying ? "Purchasing…" : canAfford ? `Buy ${quantity} cap${quantity > 1 ? "s" : ""}` : "Top up wallet first"}
              </Button>
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Only owners and admins can buy credits.</p>
      )}
    </div>
  )
}
