import type { HeatmapCell } from "@/lib/services/activity"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// Peak-hours heatmap shown when booking slots — monochrome per the brand, cell
// darkness scales with activity so advertisers can target busy windows. Times
// are UTC (matches how buckets are recorded).
export function ActivityHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const max = cells.reduce((m, c) => Math.max(m, c.count), 0) || 1
  const grid = new Map(cells.map((c) => [`${c.dayOfWeek}-${c.hour}`, c.count]))

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 space-y-3">
      <div>
        <h2 className="text-sm font-medium">When your audience is online</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Darker means busier — book slots in peak windows. Times in UTC.</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          {/* Hour axis */}
          <div className="flex pl-9">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground">
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
          </div>

          {DAY_LABELS.map((label, d) => (
            <div key={d} className="flex items-center">
              <div className="w-9 text-[10px] text-muted-foreground pr-1.5 text-right shrink-0">{label}</div>
              <div className="flex flex-1 gap-px">
                {Array.from({ length: 24 }, (_, h) => {
                  const count = grid.get(`${d}-${h}`) ?? 0
                  const intensity = count / max
                  return (
                    <div
                      key={h}
                      className="flex-1 aspect-square rounded-[2px]"
                      style={{ backgroundColor: `color-mix(in srgb, var(--foreground) ${Math.round(intensity * 100)}%, var(--bg-surface))` }}
                      title={`${label} ${String(h).padStart(2, "0")}:00 — ${count.toLocaleString()} active`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
