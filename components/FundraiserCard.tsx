"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Play, X, Users } from "lucide-react"

type FundraiserStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "COMPLETED" | "EXPIRED"
type CharityApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | null

interface FundraiserSummary {
  id: number
  title: string
  goal_amount: bigint
  raised_amount: bigint
  deadline: Date | null
  status: FundraiserStatus
  fundraiser_type: string
  charity_approval_status: CharityApprovalStatus
  _count: { donations: number }
}

const STATUS_LABELS: Record<FundraiserStatus, { label: string; className: string }> = {
  DRAFT:     { label: "Draft",     className: "bg-muted text-muted-foreground" },
  ACTIVE:    { label: "Active",    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  CLOSED:    { label: "Closed",    className: "bg-muted text-muted-foreground" },
  COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  EXPIRED:   { label: "Expired",   className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
}

function formatUGX(n: bigint) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(Number(n))
}

function daysLeft(deadline: Date | null) {
  if (!deadline) return null
  const diff = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000)
  return diff
}

export function FundraiserCard({ fundraiser: f }: { fundraiser: FundraiserSummary }) {
  const router = useRouter()
  const [loading, setLoading] = useState<"activate" | "close" | null>(null)

  const goalNum = Number(f.goal_amount)
  const raisedNum = Number(f.raised_amount)
  const progress = goalNum > 0
    ? Math.min(100, Math.round((raisedNum / goalNum) * 100))
    : 0
  const days = daysLeft(f.deadline)
  const statusMeta = STATUS_LABELS[f.status]
  const canActivate = f.status === "DRAFT" || f.status === "CLOSED"
  const canClose    = f.status === "ACTIVE"

  async function callAction(action: "activate" | "close") {
    setLoading(action)
    await fetch(`/api/fundraisers/${f.id}/${action}`, { method: "POST" })
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium truncate">{f.title}</p>
            <span className={["text-[11px] font-medium px-1.5 py-0.5 rounded-full", statusMeta.className].join(" ")}>
              {statusMeta.label}
            </span>
            {f.fundraiser_type === "CHARITY" && f.charity_approval_status && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400">
                Charity · {f.charity_approval_status.toLowerCase()}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span>{formatUGX(f.raised_amount)} raised of {formatUGX(f.goal_amount)}</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{f._count.donations}</span>
            {days !== null && (
              <span>{days > 0 ? `${days} day${days !== 1 ? "s" : ""} left` : "Deadline passed"}</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">{progress}% of goal</p>
      </div>

      {/* Actions */}
      <div className="flex items-stretch border-t border-border divide-x divide-border">
        <Link
          href={`/dashboard/fundraisers/${f.id}/edit`}
          className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>

        {canActivate && (
          <button
            type="button"
            onClick={() => callAction("activate")}
            disabled={loading !== null}
            className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition-colors disabled:opacity-40"
          >
            <Play className="h-3.5 w-3.5" />
            {loading === "activate" ? "Activating…" : "Activate"}
          </button>
        )}

        {canClose && (
          <button
            type="button"
            onClick={() => callAction("close")}
            disabled={loading !== null}
            className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
          >
            <X className="h-3.5 w-3.5" />
            {loading === "close" ? "Closing…" : "Close"}
          </button>
        )}
      </div>
    </div>
  )
}
