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

interface CurrentAffiliate {
  id: number
  reviewed_at: Date | null
  affiliate_user: {
    username: string | null
    profile: { display_name: string; avatar_url: string | null } | null
  }
  product_grants: { product: { id: number; name: string } }[]
}

interface OldAffiliate {
  id: number
  status: string
  reviewed_at: Date | null
  rejected_reason: string | null
  affiliate_user: {
    username: string | null
    profile: { display_name: string; avatar_url: string | null } | null
  }
}

interface OpenProduct {
  id: number
  name: string
}

interface Props {
  inbound: InboundRequest[]
  affiliates: CurrentAffiliate[]
  old: OldAffiliate[]
  openProducts: OpenProduct[]
}

function Avatar({ url, name }: { url?: string | null; name: string }) {
  if (!url) return (
    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
      <span className="text-xs font-medium text-muted-foreground">{name[0]?.toUpperCase()}</span>
    </div>
  )
  return <img src={url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
}

export function AffiliatePanel({ inbound, affiliates, old, openProducts }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<"pending" | "current" | "old">("pending")
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
    await fetch(`/api/affiliates/inbound/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
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

  const tabs = [
    { key: "pending" as const, label: "Pending", count: inbound.length },
    { key: "current" as const, label: "Current", count: affiliates.length },
    { key: "old" as const,     label: "Old",     count: old.length },
  ]

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
              tab === t.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pending */}
      {tab === "pending" && (
        inbound.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No pending requests.</p>
        ) : (
          <div className="space-y-3">
            {inbound.map((r) => {
              const name = r.affiliate_user.profile?.display_name ?? r.affiliate_user.username ?? "Unknown"
              return (
                <div key={r.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar url={r.affiliate_user.profile?.avatar_url} name={name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        @{r.affiliate_user.username} · {r.initiated_by === "CREATOR_REQUEST" ? "Applied" : "Invited"}
                      </p>
                    </div>
                  </div>

                  {approvingId === r.id && openProducts.length > 0 && (
                    <div className="space-y-2 border-t border-border pt-3">
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
                          {loading === r.id ? "Approving…" : "Confirm & push link"}
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
              )
            })}
          </div>
        )
      )}

      {/* Current */}
      {tab === "current" && (
        affiliates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No active affiliates.</p>
        ) : (
          <div className="space-y-3">
            {affiliates.map((a) => {
              const name = a.affiliate_user.profile?.display_name ?? a.affiliate_user.username ?? "Unknown"
              return (
                <div key={a.id} className="bg-background border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar url={a.affiliate_user.profile?.avatar_url} name={name} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          @{a.affiliate_user.username} · {a.product_grants.length} product{a.product_grants.length !== 1 ? "s" : ""}
                        </p>
                        {a.product_grants.length > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {a.product_grants.map((g) => g.product.name).join(", ")}
                          </p>
                        )}
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
              )
            })}
          </div>
        )
      )}

      {/* Old */}
      {tab === "old" && (
        old.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No past affiliate relationships.</p>
        ) : (
          <div className="space-y-3">
            {old.map((a) => {
              const name = a.affiliate_user.profile?.display_name ?? a.affiliate_user.username ?? "Unknown"
              return (
                <div key={a.id} className="bg-background border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Avatar url={a.affiliate_user.profile?.avatar_url} name={name} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        @{a.affiliate_user.username} ·{" "}
                        <span className={a.status === "REJECTED" ? "text-destructive" : "text-amber-600"}>
                          {a.status === "REJECTED" ? "Rejected" : "Suspended"}
                        </span>
                      </p>
                      {a.rejected_reason && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">Reason: {a.rejected_reason}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
