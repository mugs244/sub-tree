"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, AlertCircle, Clock } from "lucide-react"

type EscrowStatus = "HELD" | "RELEASED" | "DISPUTED" | "REFUNDED"

interface OrderData {
  id: number
  buyer_name: string
  buyer_phone: string
  buyer_email: string | null
  amount_paid: bigint
  seller_amount: bigint
  escrow_status: EscrowStatus
  escrow_release_at: Date | null
  dispute_raised_at: Date | null
  released_at: Date | null
  affiliate_amount: bigint | null
  created_at: Date
  product: { id: number; name: string; product_type: string }
}

function formatUGX(n: bigint) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(Number(n))
}

const STATUS_META: Record<EscrowStatus, { label: string; icon: React.ElementType; className: string }> = {
  HELD:     { label: "Held",     icon: Clock,        className: "text-amber-600 dark:text-amber-400" },
  RELEASED: { label: "Released", icon: CheckCircle,  className: "text-green-600 dark:text-green-400" },
  DISPUTED: { label: "Disputed", icon: AlertCircle,  className: "text-destructive" },
  REFUNDED: { label: "Refunded", icon: AlertCircle,  className: "text-muted-foreground" },
}

export function OrderRow({ order: o }: { order: OrderData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const meta = STATUS_META[o.escrow_status]
  const Icon = meta.icon

  async function handleRelease() {
    if (!confirm("Release escrow early to yourself? Only do this if you've confirmed delivery.")) return
    setLoading(true)
    await fetch(`/api/orders/${o.id}/release`, { method: "POST" })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="bg-background border border-border rounded-xl px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{o.product.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {o.buyer_name} · {o.buyer_phone}
            {o.buyer_email && ` · ${o.buyer_email}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold">{formatUGX(o.amount_paid)}</p>
          <p className="text-[11px] text-muted-foreground">You get {formatUGX(o.seller_amount)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={["flex items-center gap-1", meta.className].join(" ")}>
          <Icon className="h-3.5 w-3.5" />
          {meta.label}
          {o.escrow_status === "HELD" && o.escrow_release_at && (
            <span className="text-muted-foreground ml-1">
              · releases {new Date(o.escrow_release_at).toLocaleDateString()}
            </span>
          )}
        </span>
        <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
      </div>

      {o.affiliate_amount && Number(o.affiliate_amount) > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Affiliate commission: {formatUGX(o.affiliate_amount)}
        </p>
      )}

      {o.escrow_status === "HELD" && !o.dispute_raised_at && (
        <button
          type="button"
          onClick={handleRelease}
          disabled={loading}
          className="text-xs text-primary hover:underline disabled:opacity-50"
        >
          {loading ? "Releasing…" : "Release early"}
        </button>
      )}
    </div>
  )
}
