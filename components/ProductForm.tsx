"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ProductFormProps {
  mode: "create" | "edit"
  productId?: number
  defaults?: {
    name?: string
    description?: string
    price?: number
    product_type?: "DIGITAL" | "PHYSICAL"
    cover_image_url?: string | null
    file_url?: string | null
    shipping_info?: string | null
    stock?: number | null
    auto_release_days?: number
    affiliate_rate?: number
    affiliate_open?: boolean
    status?: "ACTIVE" | "INACTIVE"
  }
}

export function ProductForm({ mode, productId, defaults = {} }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(defaults.name ?? "")
  const [description, setDescription] = useState(defaults.description ?? "")
  const [price, setPrice] = useState(String(defaults.price ?? ""))
  const [productType, setProductType] = useState<"DIGITAL" | "PHYSICAL">(defaults.product_type ?? "DIGITAL")
  const [coverImageUrl, setCoverImageUrl] = useState(defaults.cover_image_url ?? "")
  const [fileUrl, setFileUrl] = useState(defaults.file_url ?? "")
  const [shippingInfo, setShippingInfo] = useState(defaults.shipping_info ?? "")
  const [stock, setStock] = useState(defaults.stock != null ? String(defaults.stock) : "")
  const [autoReleaseDays, setAutoReleaseDays] = useState(defaults.auto_release_days ?? 7)
  const [affiliateRate, setAffiliateRate] = useState(defaults.affiliate_rate != null ? Math.round(defaults.affiliate_rate * 100) : 0)
  const [affiliateOpen, setAffiliateOpen] = useState(defaults.affiliate_open ?? false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const priceNum = parseInt(price, 10)
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Enter a valid price")
      setLoading(false)
      return
    }

    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      product_type: productType,
      auto_release_days: autoReleaseDays,
      affiliate_rate: affiliateRate / 100,
      affiliate_open: affiliateOpen,
    }
    if (coverImageUrl.trim()) body.cover_image_url = coverImageUrl.trim()
    if (productType === "DIGITAL" && fileUrl.trim()) body.file_url = fileUrl.trim()
    if (productType === "PHYSICAL") {
      if (shippingInfo.trim()) body.shipping_info = shippingInfo.trim()
      body.stock = stock !== "" ? parseInt(stock, 10) : null
    }

    const url = mode === "create" ? "/api/shop/products" : `/api/shop/products/${productId}`
    const method = mode === "create" ? "POST" : "PATCH"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.message ?? "Something went wrong")
      return
    }

    router.push("/dashboard/shop")
    router.refresh()
  }

  const inputClass = "w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <label className={labelClass}>Product name *</label>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} placeholder="e.g. Beat Pack Vol. 1" />
      </div>

      <div>
        <label className={labelClass}>Description *</label>
        <textarea className={inputClass} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={2000} placeholder="Describe your product..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Price (UGX) *</label>
          <input className={inputClass} type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="5000" />
        </div>
        <div>
          <label className={labelClass}>Type *</label>
          <select className={inputClass} value={productType} onChange={(e) => setProductType(e.target.value as "DIGITAL" | "PHYSICAL")}>
            <option value="DIGITAL">Digital</option>
            <option value="PHYSICAL">Physical</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Cover image URL</label>
        <input className={inputClass} type="url" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://..." />
      </div>

      {productType === "DIGITAL" && (
        <div>
          <label className={labelClass}>File URL (Vercel Blob or direct link)</label>
          <input className={inputClass} type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
          <p className="text-[11px] text-muted-foreground mt-1">Buyer receives a signed download link valid 48h / 3 downloads after payment.</p>
        </div>
      )}

      {productType === "PHYSICAL" && (
        <>
          <div>
            <label className={labelClass}>Shipping instructions (shown to buyer after purchase)</label>
            <textarea className={inputClass} rows={3} value={shippingInfo} onChange={(e) => setShippingInfo(e.target.value)} placeholder="e.g. Delivered within Kampala in 1-3 days. Contact 07XX..." />
          </div>
          <div>
            <label className={labelClass}>Stock (leave blank for unlimited)</label>
            <input className={inputClass} type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Unlimited" />
          </div>
        </>
      )}

      <div>
        <label className={labelClass}>Escrow auto-release</label>
        <select className={inputClass} value={autoReleaseDays} onChange={(e) => setAutoReleaseDays(parseInt(e.target.value, 10))}>
          <option value={3}>3 days</option>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
        </select>
        <p className="text-[11px] text-muted-foreground mt-1">Funds release to you after this period if no dispute is raised.</p>
      </div>

      <div className="border border-border rounded-lg p-4 space-y-3">
        <p className="text-xs font-medium">Affiliate program</p>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="affiliate_open"
            checked={affiliateOpen}
            onChange={(e) => setAffiliateOpen(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <label htmlFor="affiliate_open" className="text-sm text-muted-foreground">Allow affiliates to promote this product</label>
        </div>
        {affiliateOpen && (
          <div>
            <label className={labelClass}>Commission rate: {affiliateRate}%</label>
            <input type="range" min={0} max={50} value={affiliateRate} onChange={(e) => setAffiliateRate(parseInt(e.target.value, 10))} className="w-full" />
            <p className="text-[11px] text-muted-foreground mt-1">Affiliate earns {affiliateRate}% of the sale price. Comes out of your share.</p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? (mode === "create" ? "Creating…" : "Saving…") : (mode === "create" ? "Create product" : "Save changes")}
      </button>
    </form>
  )
}
