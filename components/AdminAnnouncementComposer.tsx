"use client"

import { useEffect, useMemo, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type User = {
  id: number
  username: string | null
  email: string
  display_name: string | null
}

type Scope = "all" | "user"

export function AdminAnnouncementComposer() {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [scope, setScope] = useState<Scope>("all")
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState("")
  const [targetUserId, setTargetUserId] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (scope !== "user" || users.length > 0) return
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data: User[]) => setUsers(data ?? []))
      .catch(() => {})
  }, [scope, users.length])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users.slice(0, 8)
    return users
      .filter(
        (u) =>
          (u.username ?? "").toLowerCase().includes(q) ||
          (u.display_name ?? "").toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [users, search])

  const selectedUser = users.find((u) => u.id === targetUserId) ?? null
  const canSend = title.trim().length > 0 && body.trim().length > 0 && (scope === "all" || targetUserId !== null)

  async function send() {
    setSending(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          ...(scope === "user" && targetUserId ? { targetUserId } : {}),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? "Failed to send announcement")
      }
      const { data } = (await res.json()) as { data: { sentTo: number } }
      setResult(`Sent to ${data.sentTo} ${data.sentTo === 1 ? "user" : "users"}`)
      setTitle("")
      setBody("")
      setTargetUserId(null)
      setSearch("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send announcement")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Scheduled maintenance" maxLength={120} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Message</label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="What should users know?" maxLength={2000} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Send to</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScope("all")}
            className={[
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150",
              scope === "all" ? "bg-foreground text-background" : "bg-background border border-border text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            All users
          </button>
          <button
            type="button"
            onClick={() => setScope("user")}
            className={[
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150",
              scope === "user" ? "bg-foreground text-background" : "bg-background border border-border text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Specific user
          </button>
        </div>
      </div>

      {scope === "user" && (
        <div className="space-y-2">
          <Input
            value={selectedUser ? `@${selectedUser.username}` : search}
            onChange={(e) => {
              setTargetUserId(null)
              setSearch(e.target.value)
            }}
            placeholder="Search by username or email…"
          />
          {!selectedUser && search && (
            <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground px-3 py-2">No matching users</p>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setTargetUserId(u.id)
                      setSearch("")
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-background transition-colors duration-150"
                  >
                    <span className="font-medium">{u.display_name ?? u.username ?? "Unnamed"}</span>{" "}
                    <span className="text-muted-foreground font-mono text-xs">
                      {u.username ? `@${u.username}` : u.email}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button onClick={() => void send()} disabled={!canSend || sending}>
          {sending ? "Sending…" : "Send announcement"}
        </Button>
        {result && <p className="text-sm text-success">{result}</p>}
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    </div>
  )
}
