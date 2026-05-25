"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"

interface CampaignRequest {
  id: number
  title: string
  description: string
  goal_amount: bigint
  deadline: Date | null
  created_at: Date
  user: {
    username: string | null
    profile: { display_name: string; avatar_url: string | null } | null
  }
}

interface Props {
  requests: CampaignRequest[]
}

function formatUGX(n: bigint) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(Number(n))
}

export function CampaignRequestsPanel({ requests }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<number | null>(null)
  const [approvingId, setApprovingId] = useState<number | null>(null)
  const [charitySplitPct, setCharitySplitPct] = useState(90)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  async function handleApprove(id: number) {
    setLoading(id)
    await fetch(`/api/fundraisers/${id}/charity-request`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "APPROVED", charity_split_charity_pct: charitySplitPct }),
    })
    setLoading(null)
    setApprovingId(null)
    router.refresh()
  }

  async function handleReject(id: number) {
    setLoading(id)
    await fetch(`/api/fundraisers/${id}/charity-request`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REJECTED", rejection_reason: rejectReason.trim() || undefined }),
    })
    setLoading(null)
    setRejectingId(null)
    setRejectReason("")
    router.refresh()
  }

  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No pending campaign requests.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => {
        const name = r.user.profile?.display_name ?? r.user.username ?? "Unknown"
        return (
          <div key={r.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
            {/* Creator info */}
            <div className="flex items-center gap-3">
              {r.user.profile?.avatar_url ? (
                <img src={r.user.profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-muted-foreground">{name[0]?.toUpperCase()}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{name}</p>
                <p className="text-xs text-muted-foreground">@{r.user.username}</p>
              </div>
            </div>

            {/* Campaign details */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">{r.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
              <div className="flex gap-3 pt-1">
                <span className="text-xs text-muted-foreground">Goal: {formatUGX(r.goal_amount)}</span>
                {r.deadline && (
                  <span className="text-xs text-muted-foreground">
                    Deadline: {new Date(r.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Approve flow */}
            {approvingId === r.id && (
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground">Set donation split:</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={charitySplitPct}
                    onChange={(e) => setCharitySplitPct(parseInt(e.target.value, 10))}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono w-32 shrink-0 text-right">
                    You {charitySplitPct}% / Creator {100 - charitySplitPct}%
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Split applies at settlement via Pesapal — funds go directly to each party.
                </p>
              </div>
            )}

            {/* Reject flow */}
            {rejectingId === r.id && (
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground">Reason (optional):</p>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Campaign not aligned with our mission"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  maxLength={500}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {approvingId === r.id ? (
                <>
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={loading === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {loading === r.id ? "Approving…" : "Confirm approval"}
                  </button>
                  <button
                    onClick={() => setApprovingId(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </>
              ) : rejectingId === r.id ? (
                <>
                  <button
                    onClick={() => handleReject(r.id)}
                    disabled={loading === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    {loading === r.id ? "Rejecting…" : "Confirm rejection"}
                  </button>
                  <button
                    onClick={() => { setRejectingId(null); setRejectReason("") }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setApprovingId(r.id); setRejectingId(null) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => { setRejectingId(r.id); setApprovingId(null) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
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
}
