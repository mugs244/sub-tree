"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarDays, BadgeCheck, Plus, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type DurationType = "HOUR" | "DAY" | "WEEK" | "BIWEEKLY" | "MONTH"
type BookingStatus = "DRAFT" | "READY" | "PUBLISHED" | "COMPLETED" | "CANCELLED" | "REFUNDED"
type ViewRange = "today" | "week" | "biweekly" | "month"

interface BookingRow {
  id: number
  advertiserId: number
  startsAt: string
  endsAt: string
  durationType: DurationType
  status: BookingStatus
  companyName: string
  verified: boolean
  format: string | null
}

const VIEW_RANGE_DAYS: Record<ViewRange, number> = {
  today: 1,
  week: 7,
  biweekly: 14,
  month: 30,
}

const VIEW_RANGE_LABELS: Record<ViewRange, string> = {
  today: "Today",
  week: "Week",
  biweekly: "Biweekly",
  month: "Month",
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  DRAFT: "Booked — no content yet",
  READY: "Ready to publish",
  PUBLISHED: "Live",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
}

function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-UG", { hour: "numeric", minute: "2-digit" })
}

function fmtDay(key: string): string {
  return new Date(key + "T00:00:00").toLocaleDateString("en-UG", { weekday: "short", day: "numeric", month: "short" })
}

export function AdSlotsCalendar({
  plan,
  walletBalanceUgx,
  activeCount,
  cap,
  viewerAdvertiserId,
  initialFrom,
  initialBookings,
}: {
  plan: "STARTUP" | "GROWTH" | "ENTERPRISE"
  walletBalanceUgx: string
  activeCount: number
  cap: number
  viewerAdvertiserId: number
  initialFrom: string
  initialBookings: BookingRow[]
}) {
  const router = useRouter()
  const [range, setRange] = useState<ViewRange>("week")
  const [bookings, setBookings] = useState<BookingRow[]>(initialBookings)
  const [loading, setLoading] = useState(false)
  const [bookOpen, setBookOpen] = useState(false)
  const [bookDate, setBookDate] = useState("")
  const [bookTime, setBookTime] = useState("09:00")
  const [bookDuration, setBookDuration] = useState<DurationType>("HOUR")
  const [bookError, setBookError] = useState<string | null>(null)
  const [booking, setBooking] = useState(false)

  const balance = Number(walletBalanceUgx)
  const atCap = activeCount >= cap

  const days = useMemo(() => {
    const from = new Date(initialFrom)
    from.setHours(0, 0, 0, 0)
    const n = VIEW_RANGE_DAYS[range]
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(from)
      d.setDate(d.getDate() + i)
      return d.toISOString().slice(0, 10)
    })
  }, [initialFrom, range])

  const byDay = useMemo(() => {
    const map = new Map<string, BookingRow[]>()
    for (const b of bookings) {
      const key = dayKey(b.startsAt)
      const list = map.get(key) ?? []
      list.push(b)
      map.set(key, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    return map
  }, [bookings])

  async function changeRange(next: ViewRange) {
    setRange(next)
    setLoading(true)
    try {
      const from = new Date(initialFrom)
      const to = new Date(from.getTime() + VIEW_RANGE_DAYS[next] * 24 * 60 * 60 * 1000)
      const res = await fetch(`/api/business/ad-slots?from=${from.toISOString()}&to=${to.toISOString()}`)
      const json = await res.json()
      if (res.ok) setBookings(json.data)
    } finally {
      setLoading(false)
    }
  }

  function openBookModal(date: string) {
    setBookDate(date)
    setBookTime("09:00")
    setBookDuration("HOUR")
    setBookError(null)
    setBookOpen(true)
  }

  function durationEnd(startsAt: Date, durationType: DurationType): Date {
    const ms: Record<DurationType, number> = {
      HOUR: 60 * 60 * 1000,
      DAY: 24 * 60 * 60 * 1000,
      WEEK: 7 * 24 * 60 * 60 * 1000,
      BIWEEKLY: 14 * 24 * 60 * 60 * 1000,
      MONTH: 30 * 24 * 60 * 60 * 1000,
    }
    return new Date(startsAt.getTime() + ms[durationType])
  }

  async function submitBooking() {
    setBooking(true)
    setBookError(null)
    try {
      const startsAt = new Date(`${bookDate}T${bookTime}:00`)
      const endsAt = durationEnd(startsAt, bookDuration)
      const res = await fetch("/api/business/ad-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), durationType: bookDuration }),
      })
      const json = await res.json()
      if (!res.ok) {
        setBookError(json.message ?? "Could not book this slot")
        return
      }
      setBookOpen(false)
      router.push(`/business/ad-slots/${json.data.bookingId}/editor`)
    } catch {
      setBookError("Network error — please try again")
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="px-4 py-5 md:p-8 max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ad slots</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {plan.charAt(0) + plan.slice(1).toLowerCase()} plan · {activeCount} of {cap} slots in use
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Wallet balance</p>
          <p className="text-lg font-semibold tracking-tight">UGX {balance.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-surface border border-border p-1 rounded-lg w-fit">
        {(Object.keys(VIEW_RANGE_LABELS) as ViewRange[]).map((r) => (
          <button
            key={r}
            onClick={() => void changeRange(r)}
            className={[
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              range === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {VIEW_RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {atCap && (
        <p className="text-xs text-muted-foreground bg-surface border border-border rounded-lg p-3">
          You&apos;ve reached your plan&apos;s concurrent slot cap. Free up a slot, or buy additional caps in Credits.
        </p>
      )}

      <div className={["space-y-3", loading ? "opacity-60" : ""].join(" ")}>
        {days.map((day) => {
          const dayBookings = byDay.get(day) ?? []
          return (
            <div key={day} className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-surface">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                  {fmtDay(day)}
                </div>
                <Button size="sm" variant="ghost" onClick={() => openBookModal(day)} disabled={atCap}>
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                  Book a slot
                </Button>
              </div>
              {dayBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground px-4 py-4">No slots booked yet</p>
              ) : (
                <div className="divide-y divide-border">
                  {dayBookings.map((b) => {
                    const isOwn = b.advertiserId === viewerAdvertiserId
                    const inner = (
                      <>
                        <div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {fmtTime(b.startsAt)}–{fmtTime(b.endsAt)}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium">{isOwn ? "Your ad" : b.companyName}</span>
                            {b.verified && <BadgeCheck className="h-3.5 w-3.5 text-foreground" strokeWidth={1.75} />}
                          </div>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          {STATUS_LABEL[b.status]}
                          {isOwn && <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />}
                        </span>
                      </>
                    )
                    return isOwn ? (
                      <Link
                        key={b.id}
                        href={`/business/ad-slots/${b.id}/editor`}
                        className="flex items-center justify-between px-4 py-3 text-sm hover:bg-surface transition-colors"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div key={b.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        {inner}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {bookOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-lg">Book an ad slot</h2>
              <p className="text-sm text-muted-foreground mt-1">{fmtDay(bookDate)}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="book-time">Start time</label>
              <input
                id="book-time"
                type="time"
                value={bookTime}
                onChange={(e) => setBookTime(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="book-duration">Duration</label>
              <select
                id="book-duration"
                value={bookDuration}
                onChange={(e) => setBookDuration(e.target.value as DurationType)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="HOUR">Hour</option>
                <option value="DAY">Day</option>
                <option value="WEEK">Week</option>
                <option value="BIWEEKLY">Biweekly</option>
                <option value="MONTH">Month</option>
              </select>
            </div>

            {bookError && <p className="text-xs text-destructive">{bookError}</p>}

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setBookOpen(false)} disabled={booking}>Cancel</Button>
              <Button onClick={() => void submitBooking()} disabled={booking}>
                {booking ? "Booking…" : "Book slot"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
