"use client"

import { useState } from "react"
import { Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ClaimRow {
  id: number
  username: string
  status: string
  message: string | null
  created_at: string
  user: {
    id: number
    email: string | null
    username: string | null
    profile: { display_name: string } | null
  }
}

interface AdminClaimsTableProps {
  initialClaims: ClaimRow[]
}

export function AdminClaimsTable({ initialClaims }: AdminClaimsTableProps) {
  const [claims, setClaims] = useState(initialClaims)
  const [processing, setProcessing] = useState<number | null>(null)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectMessage, setRejectMessage] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleAction(claimId: number, action: "approve" | "reject", message?: string) {
    setProcessing(claimId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/claims/${claimId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, message }),
      })
      if (!res.ok) {
        const body = (await res.json()) as { message?: string }
        setError(body.message ?? "Action failed")
        return
      }
      setClaims((prev) => prev.filter((c) => c.id !== claimId))
      setRejectId(null)
      setRejectMessage("")
    } catch {
      setError("Could not complete action — please try again")
    } finally {
      setProcessing(null)
    }
  }

  if (claims.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-muted-foreground">
        No pending claims.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Username</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Requester</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Requested</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {claims.map((claim) => (
              <tr key={claim.id} className="bg-background">
                <td className="px-4 py-3 font-mono font-medium">@{claim.username}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{claim.user.profile?.display_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{claim.user.email ?? "—"}</p>
                  {claim.user.username && (
                    <p className="text-xs text-muted-foreground font-mono">@{claim.user.username}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(claim.created_at).toLocaleDateString("en-UG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  {rejectId === claim.id ? (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Reason (optional)"
                        value={rejectMessage}
                        onChange={(e) => setRejectMessage(e.target.value)}
                        maxLength={300}
                        className="h-8 px-2 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          disabled={processing === claim.id}
                          onClick={() => handleAction(claim.id, "reject", rejectMessage || undefined)}
                        >
                          {processing === claim.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : "Confirm reject"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => { setRejectId(null); setRejectMessage("") }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={processing !== null}
                        onClick={() => handleAction(claim.id, "approve")}
                      >
                        {processing === claim.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <><Check className="h-3.5 w-3.5 mr-1" />Approve</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={processing !== null}
                        onClick={() => setRejectId(claim.id)}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />Reject
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
