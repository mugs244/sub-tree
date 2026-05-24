"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Package, Zap } from "lucide-react"

type ProductStatus = "ACTIVE" | "INACTIVE" | "SOLD_OUT"

interface ProductSummary {
  id: number
  name: string
  price: bigint
  product_type: string
  status: ProductStatus
  stock: number | null
  affiliate_open: boolean
  _count: { orders: number }
}

const STATUS_LABELS: Record<ProductStatus, { label: string; className: string }> = {
  ACTIVE:   { label: "Active",   className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  INACTIVE: { label: "Inactive", className: "bg-muted text-muted-foreground" },
  SOLD_OUT: { label: "Sold out", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
}

function formatUGX(n: bigint) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(Number(n))
}

export function ProductCard({ product: p }: { product: ProductSummary }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const statusMeta = STATUS_LABELS[p.status]

  async function handleDeactivate() {
    if (!confirm("Deactivate this product? It will no longer appear on your shop.")) return
    setDeleting(true)
    await fetch(`/api/shop/products/${p.id}`, { method: "DELETE" })
    router.refresh()
    setDeleting(false)
  }

  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium truncate">{p.name}</p>
            <span className={["text-[11px] font-medium px-1.5 py-0.5 rounded-full", statusMeta.className].join(" ")}>
              {statusMeta.label}
            </span>
            {p.product_type === "DIGITAL" && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                <Zap className="inline h-2.5 w-2.5 mr-0.5" />Digital
              </span>
            )}
            {p.product_type === "PHYSICAL" && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400">
                <Package className="inline h-2.5 w-2.5 mr-0.5" />Physical
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span>{formatUGX(p.price)}</span>
            <span>{p._count.orders} sale{p._count.orders !== 1 ? "s" : ""}</span>
            {p.stock !== null && <span>Stock: {p.stock}</span>}
            {p.affiliate_open && <span className="text-violet-600 dark:text-violet-400">Affiliate open</span>}
          </div>
        </div>
      </div>

      <div className="flex items-stretch border-t border-border divide-x divide-border">
        <Link
          href={`/dashboard/shop/products/${p.id}/edit`}
          className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>
        {p.status !== "INACTIVE" && (
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={deleting}
            className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Deactivating…" : "Deactivate"}
          </button>
        )}
      </div>
    </div>
  )
}
