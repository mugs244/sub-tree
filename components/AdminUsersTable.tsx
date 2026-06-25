"use client"

import { useState, useEffect, useMemo } from "react"
import { Search } from "lucide-react"

type User = {
  id: number
  username: string | null
  display_name: string | null
  email: string
  country_code: string | null
  last_active_at: string | null
  created_at: string
  suspended: boolean
}

export default function AdminUsersTable() {
  const [users, setUsers] = useState<User[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [actionId, setActionId] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data: User[]) => setUsers(data ?? []))
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!users) return []
    const q = search.toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.username ?? "").toLowerCase().includes(q) ||
        (u.display_name ?? "").toLowerCase().includes(q),
    )
  }, [users, search])

  async function toggleSuspend(id: number, suspend: boolean) {
    setActionId(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: suspend ? "suspend" : "reactivate" }),
      })
      if (!res.ok) throw new Error()
      setUsers((prev) =>
        prev?.map((u) => (u.id === id ? { ...u, suspended: suspend } : u)) ?? prev,
      )
    } catch {
      setError("Failed to update user status")
    } finally {
      setActionId(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border px-5 py-10 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-error-bg text-error px-4 py-2 text-sm">{error}</p>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Search by email, username, or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Email
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Country
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Last active
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    {search ? `No users match "${search}".` : "No users yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-surface/50 transition-colors duration-100">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {u.display_name ?? u.username ?? "—"}
                      </p>
                      {u.username && (
                        <p className="text-xs text-muted-foreground font-mono">
                          @{u.username}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {u.email}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-sm text-muted-foreground">
                      {u.country_code ?? "—"}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-xs text-muted-foreground">
                      {u.last_active_at
                        ? new Date(u.last_active_at).toLocaleDateString("en-UG", {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          })
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                          u.suspended
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-green-50 text-green-700 border border-green-200",
                        ].join(" ")}
                      >
                        {u.suspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => void toggleSuspend(u.id, !u.suspended)}
                        disabled={actionId === u.id}
                        className={[
                          "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                          u.suspended
                            ? "border-border text-foreground hover:bg-surface"
                            : "border-red-200 text-red-700 hover:bg-red-50",
                        ].join(" ")}
                      >
                        {actionId === u.id ? "…" : u.suspended ? "Reactivate" : "Suspend"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="border-t border-border bg-surface px-4 py-2 text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "user" : "users"}
            {search ? ` matching "${search}"` : ""}
          </div>
        )}
      </div>
    </div>
  )
}
