"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, ArrowUpRight, Megaphone, MessageCircle, Bell, Inbox } from "lucide-react"

// One timeline for everything that happens on a creator's account: donations,
// withdrawals and updates (support replies, announcements). Replaces the old
// separate Donations / Notifications tabs, where each donation showed twice.

export type ActivityKind = "donation" | "withdrawal" | "update"
export type ActivityFilter = "all" | "donations" | "withdrawals" | "updates"

export interface ActivityItem {
  key: string
  kind: ActivityKind
  at: string // ISO
  title: string
  detail: string
  amount?: number // UGX; positive in, negative out
  status?: string
  unread?: boolean
  icon?: "heart" | "out" | "megaphone" | "message" | "bell"
  href?: string
  /** Button label shown on the row, e.g. "Pay now". */
  action?: string
}

const FILTERS: { value: ActivityFilter; label: string; kind?: ActivityKind }[] = [
  { value: "all", label: "All" },
  { value: "donations", label: "Donations", kind: "donation" },
  { value: "withdrawals", label: "Withdrawals", kind: "withdrawal" },
  { value: "updates", label: "Updates", kind: "update" },
]

const ICONS = { heart: Heart, out: ArrowUpRight, megaphone: Megaphone, message: MessageCircle, bell: Bell }

const STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-warning-bg text-warning" },
  PROCESSING: { label: "Processing", className: "bg-warning-bg text-warning" },
  FAILED: { label: "Failed", className: "bg-error-bg text-error" },
  REVERSED: { label: "Reversed", className: "bg-surface text-muted-foreground" },
}

// Everything is formatted in Kampala time so the server render and the
// browser agree (and creators see local times wherever the server runs).
const TZ = "Africa/Kampala"
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ }) // YYYY-MM-DD

function dayLabel(d: Date): string {
  const now = new Date()
  const key = dayKey(d)
  if (key === dayKey(now)) return "Today"
  if (key === dayKey(new Date(now.getTime() - 86_400_000))) return "Yesterday"
  const sameYear = key.slice(0, 4) === dayKey(now).slice(0, 4)
  return d.toLocaleDateString("en-UG", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: sameYear ? undefined : "numeric" })
}

export function ActivityFeed({
  items,
  initialFilter,
  hasUnread,
}: {
  items: ActivityItem[]
  initialFilter: ActivityFilter
  hasUnread: boolean
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<ActivityFilter>(initialFilter)

  // Seeing the feed reads everything; refresh so the nav badge clears.
  useEffect(() => {
    if (!hasUnread) return
    void fetch("/api/notifications/read-all", { method: "POST" }).then(() => router.refresh())
  }, [hasUnread, router])

  // Keep the feed live, like the old notifications tab did.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000)
    return () => clearInterval(id)
  }, [router])

  const groups = useMemo(() => {
    const kind = FILTERS.find((f) => f.value === filter)?.kind
    const visible = kind ? items.filter((i) => i.kind === kind) : items
    const out: { label: string; items: ActivityItem[] }[] = []
    for (const item of visible) {
      const label = dayLabel(new Date(item.at))
      const last = out[out.length - 1]
      if (last && last.label === label) last.items.push(item)
      else out.push({ label, items: [item] })
    }
    return out
  }, [items, filter])

  function choose(next: ActivityFilter) {
    setFilter(next)
    const url = next === "all" ? "/dashboard/activity" : `/dashboard/activity?filter=${next}`
    window.history.replaceState(null, "", url)
  }

  return (
    <div className="space-y-5">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" role="tablist" aria-label="Filter activity">
        {FILTERS.map((f) => {
          const active = filter === f.value
          return (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => choose(f.value)}
              className={[
                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150",
                active
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--dash-orange-soft)]">
            <Inbox className="h-6 w-6 text-[color:var(--dash-orange-text)]" strokeWidth={1.75} />
          </span>
          <p className="mt-4 text-sm font-semibold">Nothing here yet</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Donations, withdrawals and updates from Sub-tree will show up here as they happen.
          </p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.label} className="space-y-2">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</h2>
            <ul className="space-y-2.5">
              {g.items.map((item) => <Row key={item.key} item={item} />)}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

function Row({ item }: { item: ActivityItem }) {
  const Icon = ICONS[item.icon ?? "bell"]
  const status = item.status ? STATUS[item.status] : undefined
  const time = new Date(item.at).toLocaleTimeString("en-UG", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })
  const incoming = (item.amount ?? 0) > 0

  const body = (
    <>
      <span
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
          item.kind === "donation" ? "bg-[#ff8a3d] text-[#111827]" : "bg-[#111827] text-white dark:bg-white/10",
        ].join(" ")}
      >
        <Icon className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold">{item.title}</span>
          {item.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--dash-orange)]" aria-label="New" />}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>
      </span>
      <span className="shrink-0 text-right">
        {item.amount !== undefined && (
          <span className={["block text-sm font-semibold tabular-nums", incoming ? "text-[color:var(--dash-orange-text)]" : ""].join(" ")}>
            {incoming ? "+" : "−"}{Math.abs(item.amount).toLocaleString()}
          </span>
        )}
        {item.action ? (
          <span className="inline-flex rounded-full bg-[#ff8a3d] px-3 py-1.5 text-xs font-bold text-[#111827]">{item.action}</span>
        ) : status ? (
          <span className={["mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold", status.className].join(" ")}>
            {status.label}
          </span>
        ) : (
          <span className="block text-[11px] text-muted-foreground">{time}</span>
        )}
      </span>
    </>
  )

  const cls = ["flex items-center gap-3 rounded-2xl px-4 py-3.5", item.unread ? "bg-[color:var(--dash-orange-soft)]" : "bg-surface"].join(" ")
  return (
    <li>
      {item.href ? (
        <Link href={item.href} className={[cls, "transition-colors hover:brightness-[0.98]"].join(" ")}>{body}</Link>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </li>
  )
}
