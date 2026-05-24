"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X, UserX } from "lucide-react"

interface InboundRequest {
  id: number
  initiated_by: string
  requested_at: Date
  affiliate_user: {
    username: string | null
    profile: { display_name: string; avatar_url: string | null } | null
  }
}

interface ActiveAffiliate {
  id: number
  reviewed_at: Date | null
  affiliate_user: {
    username: string | null
    profile: { display_name: string; avatar_url: string | null } | null
  }
  product_grants: { product: { id: number; name: string } }[]
}

interface OpenProduct {
  id: number
  name: string
}

interface Props {
  inbound: InboundRequest[]
  affiliates: ActiveAffiliate[]
  openProducts: OpenProduct[]
}

export function AffiliatePanel({ inbound, affiliates, openProducts }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<number | null>(null)
  const [approvingId, setApprovingId] = useState<number | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])

  async function handleApprove(id: number) {
    if (selectedProducts.length === 0) {
      alert("Select at least one product to grant access to.")
      return
    }
    setLoading(id)
    await fetch(`/api/affiliates/inbound/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_ids: selectedProducts }),
    })
    setLoading(null)
    setApprovingId(null)
    setSelectedProducts([])
    router.refresh()
  }

  async function handleReject(id: number) {
    setLoading(id)
    await fetch(`/api/affiliates/inbound/${id}/reject`, { method: "POST", body: JSON.stringify({}) })
    setLoading(null)
    router.refresh()
  }

  async function handleSuspend(id: number) {
    if (!confirm("Suspend this affiliate? They will no longer be able to promote your products.")) return
    setLoading(id)
    await fetch(`/api/affiliates/${id}/suspend`, { method: "POST" })
    setLoading(null)
    router.refresh()
  }

  function toggleProduct(id: number) {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  return (
    <div className="space-y-6">
      {/* Inbound requests */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Pending requests ({inbound.length})
        </p>
        {inbound.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No pending requests.</p>
        ) : (
          <div className="space-y-3">
            {inbound.map((r) => (
              <div key={r.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {r.affiliate_user.profile?.avatar_url && (
                    <img src={r.affiliate_user.profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.affiliate_user.profile?.display_name ?? r.affiliate_user.username}</p>
                    <p className="text-xs text-muted-foreground">@{r.affiliate_user.username} · {r.initiated_by === "CREATOR_REQUEST" ? "Applied" : "Invited"}</p>
                  </div>
                </div>

                {approvingId === r.id && openProducts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Select products to grant:</p>
                    {openProducts.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(p.id)}
                          onChange={() => toggleProduct(p.id)}
                          className="h-4 w-4 rounded border-border"
                        />
                        <span className="text-sm">{p.name}</span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  {approvingId === r.id ? (
                    <>
                      <button
                        onClick={() => handleApprove(r.id)}
                        disabled={loading === r.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {loading === r.id ? "Approving…" : "Confirm"}
                      </button>
                      <button onClick={() => { setApprovingId(null); setSelectedProducts([]) }} className="text-xs text-muted-foreground hover:text-foreground">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setApprovingId(r.id); setSelectedProducts([]) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        disabled={loading === r.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-muted-foreground hover:text-destructive hover:border-destructive transition-colors disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active affiliates */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Active affiliates ({affiliates.length})
        </p>
        {affiliates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No active affiliates.</p>
        ) : (
          <div className="space-y-3">
            {affiliates.map((a) => (
              <div key={a.id} className="bg-background border border-border rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {a.affiliate_user.profile?.avatar_url && (
                      <img src={a.affiliate_user.profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.affiliate_user.profile?.display_name ?? a.affiliate_user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        @{a.affiliate_user.username} · {a.product_grants.length} product{a.product_grants.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSuspend(a.id)}
                    disabled={loading === a.id}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 shrink-0"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    Suspend
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
