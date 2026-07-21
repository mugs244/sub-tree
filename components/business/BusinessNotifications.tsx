"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface NotificationRow {
  id: number
  type: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
}

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" })
}

export function BusinessNotifications({ initialNotifications }: { initialNotifications: NotificationRow[] }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)

  const unread = notifications.filter((n) => !n.readAt)

  async function markRead(id: number) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)))
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" })
      router.refresh()
    } catch {
      // Optimistic update stays; a refresh will reconcile if it failed.
    }
  }

  async function markAllRead() {
    const ids = unread.map((n) => n.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    await Promise.all(ids.map((id) => fetch(`/api/notifications/${id}/read`, { method: "PATCH" }).catch(() => {})))
    router.refresh()
  }

  return (
    <div className="px-4 py-5 md:p-8 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        {unread.length > 0 && (
          <button onClick={() => void markAllRead()} className="text-xs text-muted-foreground hover:text-foreground">
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center border border-border rounded-xl">
          No notifications yet
        </p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {notifications.map((n) => {
            const isUnread = !n.readAt
            return (
              <button
                key={n.id}
                onClick={() => isUnread && void markRead(n.id)}
                className={[
                  "w-full text-left px-4 py-3 flex gap-3 transition-colors",
                  isUnread ? "bg-surface" : "bg-background",
                  isUnread ? "hover:bg-surface/70" : "",
                ].join(" ")}
              >
                <span
                  className={["mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", isUnread ? "bg-foreground" : "bg-transparent"].join(" ")}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{fmtWhen(n.createdAt)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
