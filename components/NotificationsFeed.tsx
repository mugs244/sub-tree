"use client"

import { useEffect, useState, useCallback } from "react"
import { Bell, Heart, Wallet, MessageCircle, Megaphone } from "lucide-react"

interface NotificationItem {
  id: number
  type: string
  title: string
  body: string
  read_at: string | null
  created_at: string
}

const TYPE_ICON: Record<string, React.ElementType> = {
  DONATION_RECEIVED: Heart,
  WITHDRAWAL_REQUESTED: Wallet,
  WITHDRAWAL_COMPLETED: Wallet,
  WITHDRAWAL_FAILED: Wallet,
  SUPPORT_MESSAGE: MessageCircle,
  ANNOUNCEMENT: Megaphone,
}

export function NotificationsFeed() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) return
      const { data } = (await res.json()) as { data: NotificationItem[] }
      setItems(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
    const interval = setInterval(fetchItems, 30_000)
    return () => clearInterval(interval)
  }, [fetchItems])

  async function markRead(id: number) {
    navigator?.vibrate?.(20)
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
      ),
    )
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" })
  }

  if (loading) {
    return (
      <ul className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <li key={i} className="flex items-start gap-3 rounded-xl border border-border px-4 py-3">
            <span className="mt-1.5 h-2 w-2 rounded-full bg-surface animate-pulse shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-3.5 rounded-md bg-surface animate-pulse w-3/4" />
              <div className="h-3 rounded-md bg-surface animate-pulse w-1/2" />
              <div className="h-3 rounded-md bg-surface animate-pulse w-1/4" />
            </div>
          </li>
        ))}
      </ul>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
        <Bell className="h-8 w-8 text-muted-foreground/40" strokeWidth={1} />
        <p className="text-sm text-muted-foreground">No notifications yet</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((n) => {
        const unread = !n.read_at
        const Icon = TYPE_ICON[n.type] ?? Bell
        const time = new Date(n.created_at).toLocaleDateString("en-UG", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })

        return (
          <li
            key={n.id}
            onClick={() => unread && markRead(n.id)}
            className={[
              "flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors duration-150",
              unread
                ? "border-foreground/20 bg-surface cursor-pointer hover:border-foreground/30"
                : "border-border bg-background",
            ].join(" ")}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{n.body}</p>
              <span className="text-xs text-muted-foreground mt-1 block">{time}</span>
            </div>
            {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-foreground" />}
          </li>
        )
      })}
    </ul>
  )
}
