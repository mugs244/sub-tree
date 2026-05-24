"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  productId: number
  productName: string
  affiliateUserId: number | null
}

export function ShopCheckoutForm({ productId, productName, affiliateUserId }: Props) {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pollingKey, setPollingKey] = useState<string | null>(null)
  const [pollState, setPollState] = useState<"pending" | "confirmed" | "failed">("pending")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Set attribution cookie if affiliate context present
    if (affiliateUserId) {
      document.cookie = `subtree_ref=${affiliateUserId}; max-age=${7 * 24 * 3600}; path=/; samesite=lax`
    }

    const res = await fetch("/api/orders/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        buyer_phone: phone.trim(),
        buyer_name: name.trim(),
        buyer_email: email.trim() || undefined,
      }),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.message ?? "Something went wrong")
      return
    }

    setPollingKey(json.data.idempotency_key)
    poll(json.data.idempotency_key)
  }

  async function poll(key: string, attempts = 0) {
    if (attempts > 30) {
      setPollState("failed")
      return
    }
    await new Promise((r) => setTimeout(r, 3000))
    try {
      const res = await fetch(`/api/orders/${key}/status`)
      if (!res.ok) { poll(key, attempts + 1); return }
      const json = await res.json()
      const { payment_confirmed } = json.data
      if (payment_confirmed) {
        setPollState("confirmed")
        router.push(`/order-success?ref=${key}`)
      } else {
        poll(key, attempts + 1)
      }
    } catch {
      poll(key, attempts + 1)
    }
  }

  const inputClass = "w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1"

  if (pollingKey) {
    return (
      <div className="text-center py-4 space-y-3">
        {pollState === "confirmed" ? (
          <>
            <div className="text-2xl">✅</div>
            <p className="text-sm font-medium">Payment confirmed!</p>
            <p className="text-xs text-muted-foreground">Redirecting…</p>
          </>
        ) : pollState === "failed" ? (
          <>
            <div className="text-2xl">⏳</div>
            <p className="text-sm font-medium">Payment is taking longer than expected</p>
            <p className="text-xs text-muted-foreground">Check your MoMo messages. If deducted, your order will be processed.</p>
          </>
        ) : (
          <>
            <div className="animate-spin text-2xl">⏳</div>
            <p className="text-sm font-medium">Waiting for payment…</p>
            <p className="text-xs text-muted-foreground">Approve the MoMo prompt on your phone for <strong>{productName}</strong></p>
          </>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-medium">Your details</p>

      {error && (
        <div className="px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <label className={labelClass}>Name *</label>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} placeholder="Your name" />
      </div>

      <div>
        <label className={labelClass}>MoMo number *</label>
        <input className={inputClass} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="07XX XXX XXX" />
        <p className="text-[11px] text-muted-foreground mt-1">MTN or Airtel Uganda. You&apos;ll receive an STK push to approve payment.</p>
      </div>

      <div>
        <label className={labelClass}>Email (optional — for digital products)</label>
        <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "Initiating payment…" : "Pay now"}
      </button>

      <p className="text-center text-[11px] text-muted-foreground">
        Funds held in escrow until delivery confirmed · Sub-tree
      </p>
    </form>
  )
}
