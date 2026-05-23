"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type Status = "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED"

interface Member {
  name: string
  phone: string
  email: string
  share_rate: string
}

interface Request {
  id: number
  status: Status
  company_email: string
  social_platforms: string[]
  features_requested: string[]
  notes: string | null
  created_at: string
  members: Member[]
}

const STATUS_LABELS: Record<Status, string> = {
  PENDING: "Pending",
  REVIEWING: "Reviewing",
  APPROVED: "Approved",
  REJECTED: "Rejected",
}

const STATUS_COLORS: Record<Status, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  REVIEWING: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
}

function RequestRow({ req: initial }: { req: Request }) {
  const [req, setReq] = useState(initial)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: "REVIEWING" | "APPROVED" | "REJECTED") {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/content-house/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) setReq((prev) => ({ ...prev, status }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-[color:var(--border-default)] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-[color:var(--bg-raised)] transition-colors"
      >
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{req.company_email}</p>
          <p className="text-[12px] text-[color:var(--text-muted)] mt-0.5">
            {req.members.length} members · {new Date(req.created_at).toLocaleDateString("en-GB")}
          </p>
        </div>
        <span
          className={[
            "shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full",
            STATUS_COLORS[req.status],
          ].join(" ")}
        >
          {STATUS_LABELS[req.status]}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[color:var(--border-default)] px-5 py-4 space-y-5 bg-[color:var(--bg-surface)]">
          {/* Platforms & features */}
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <p className="font-medium text-[color:var(--text-secondary)] mb-1">Platforms</p>
              <p>{req.social_platforms.join(", ")}</p>
            </div>
            <div>
              <p className="font-medium text-[color:var(--text-secondary)] mb-1">Features</p>
              <p>{req.features_requested.join(", ")}</p>
            </div>
          </div>

          {req.notes && (
            <div className="text-[13px]">
              <p className="font-medium text-[color:var(--text-secondary)] mb-1">Notes</p>
              <p className="text-[color:var(--text-primary)]">{req.notes}</p>
            </div>
          )}

          {/* Members table */}
          <div>
            <p className="text-[13px] font-medium text-[color:var(--text-secondary)] mb-2">Members</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="text-left text-[color:var(--text-muted)] border-b border-[color:var(--border-default)]">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Phone</th>
                    <th className="pb-2 pr-4 font-medium">Email</th>
                    <th className="pb-2 font-medium text-right">Share %</th>
                  </tr>
                </thead>
                <tbody>
                  {req.members.map((m, i) => (
                    <tr key={i} className="border-b border-[color:var(--border-default)] last:border-0">
                      <td className="py-2 pr-4">{m.name}</td>
                      <td className="py-2 pr-4 font-mono text-[12px]">{m.phone}</td>
                      <td className="py-2 pr-4">{m.email}</td>
                      <td className="py-2 text-right">{m.share_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {req.status === "PENDING" && (
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => updateStatus("REVIEWING")}
              >
                Mark reviewing
              </Button>
            )}
            {req.status !== "APPROVED" && req.status !== "REJECTED" && (
              <Button
                size="sm"
                disabled={loading}
                onClick={() => updateStatus("APPROVED")}
              >
                Approve
              </Button>
            )}
            {req.status !== "REJECTED" && (
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                className="text-[color:var(--state-error)] border-[color:var(--state-error)]/30 hover:bg-[color:var(--state-error)]/5"
                onClick={() => updateStatus("REJECTED")}
              >
                Reject
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminContentHouseTable({ requests }: { requests: Request[] }) {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-[color:var(--text-muted)]">
        No Content House requests yet.
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <RequestRow key={r.id} req={r} />
      ))}
    </div>
  )
}
