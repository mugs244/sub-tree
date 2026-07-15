"use client"

import { useState } from "react"

interface DayPoint {
  timestamp: string
  pageviews: number
  visitors: number
}

export function TrafficTrendChart({ data }: { data: DayPoint[] }) {
  const [hover, setHover] = useState<number | null>(null)

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>
  }

  const max = Math.max(...data.map((d) => d.pageviews), 1)
  const active = hover !== null ? data[hover] : null

  return (
    <div>
      <div className="h-8 mb-2">
        {active ? (
          <div className="text-sm">
            <span className="font-mono font-medium">{active.pageviews.toLocaleString()}</span>
            <span className="text-muted-foreground"> pageviews · </span>
            <span className="font-mono font-medium">{active.visitors.toLocaleString()}</span>
            <span className="text-muted-foreground"> visitors — </span>
            <span className="text-muted-foreground">
              {new Date(active.timestamp).toLocaleDateString("en-UG", { month: "short", day: "numeric" })}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Hover a bar for daily detail</p>
        )}
      </div>
      <div className="flex items-end gap-1 h-32">
        {data.map((d, i) => {
          const heightPct = Math.max((d.pageviews / max) * 100, 2)
          return (
            <button
              key={d.timestamp}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${new Date(d.timestamp).toLocaleDateString()}: ${d.pageviews} pageviews`}
              className="flex-1 flex flex-col justify-end h-full group"
            >
              <div
                style={{ height: `${heightPct}%` }}
                className={[
                  "w-full rounded-t-sm transition-colors duration-100 min-h-[2px]",
                  hover === i ? "bg-foreground" : "bg-foreground/30 group-hover:bg-foreground/60",
                ].join(" ")}
              />
            </button>
          )
        })}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground font-mono">
        <span>{new Date(data[0]!.timestamp).toLocaleDateString("en-UG", { month: "short", day: "numeric" })}</span>
        <span>{new Date(data[data.length - 1]!.timestamp).toLocaleDateString("en-UG", { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  )
}
