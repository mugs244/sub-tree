"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Role = "OWNER" | "ADMIN" | "EDITOR"

interface Member {
  id: number
  role: Role
  joinedAt: string | null
  userId: number
  email: string
  username: string | null
}

const ROLE_LABEL: Record<Role, string> = { OWNER: "Owner", ADMIN: "Admin", EDITOR: "Editor" }
const ROLE_HINT: Record<Role, string> = {
  OWNER: "Full access — billing, team, and everything below",
  ADMIN: "Book slots, manage creatives, add editors",
  EDITOR: "Manage creatives on bookings",
}

export function TeamManager({
  viewerRole,
  viewerUserId,
  initialMembers,
}: {
  viewerRole: Role
  viewerUserId: number
  initialMembers: Member[]
}) {
  const router = useRouter()
  const [members] = useState<Member[]>(initialMembers)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("EDITOR")
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyMemberId, setBusyMemberId] = useState<number | null>(null)

  const canInvite = viewerRole === "OWNER" || viewerRole === "ADMIN"

  async function invite() {
    setInviting(true)
    setError(null)
    try {
      const res = await fetch("/api/business/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? "Could not add that member")
        return
      }
      setEmail("")
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setInviting(false)
    }
  }

  async function changeRole(memberId: number, nextRole: Role) {
    setBusyMemberId(memberId)
    setError(null)
    try {
      const res = await fetch(`/api/business/team/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? "Could not change role")
        return
      }
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setBusyMemberId(null)
    }
  }

  async function remove(memberId: number) {
    setBusyMemberId(memberId)
    setError(null)
    try {
      const res = await fetch(`/api/business/team/${memberId}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? "Could not remove member")
        return
      }
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setBusyMemberId(null)
    }
  }

  return (
    <div className="px-4 py-5 md:p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground mt-1">People who can manage this business account.</p>
      </div>

      {canInvite && (
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 space-y-4">
          <h2 className="text-sm font-medium">Add a team member</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email">Their Sub-tree email</Label>
              <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {/* Only roles the viewer is allowed to grant */}
                <option value="EDITOR">Editor</option>
                {viewerRole === "OWNER" && <option value="ADMIN">Admin</option>}
              </select>
            </div>
            <Button onClick={() => void invite()} disabled={inviting || email.trim() === ""}>
              {inviting ? "Adding…" : "Add"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">{ROLE_HINT[role]}</p>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
        {members.map((m) => {
          const isSelf = m.userId === viewerUserId
          const canEdit = viewerRole === "OWNER" && !isSelf
          const canRemove = !isSelf && (viewerRole === "OWNER" || (viewerRole === "ADMIN" && m.role === "EDITOR"))
          return (
            <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-background">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {m.username ? `@${m.username}` : m.email}
                  {isSelf && <span className="text-muted-foreground font-normal"> · you</span>}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {m.email}
                  {m.joinedAt ? "" : " · invited"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {canEdit ? (
                  <select
                    value={m.role}
                    disabled={busyMemberId === m.id}
                    onChange={(e) => void changeRole(m.id, e.target.value as Role)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="EDITOR">Editor</option>
                  </select>
                ) : (
                  <span className="text-xs text-muted-foreground">{ROLE_LABEL[m.role]}</span>
                )}
                {canRemove && (
                  <button
                    onClick={() => void remove(m.id)}
                    disabled={busyMemberId === m.id}
                    className="text-xs text-destructive hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
