import { prisma } from "@/lib/db"

// Rolling platform-activity aggregation, bucketed by weekday × hour (UTC), for
// the peak-hours heatmap advertisers see when buying ad slots. Incremented at
// real touchpoints (feed requests, ad impressions) so it reflects when the
// audience is actually online; seeded with a representative pattern until real
// traffic accumulates.

// Best-effort — a failed activity write must never break the request it trails.
export async function recordActivity(at: Date = new Date()): Promise<void> {
  try {
    const day_of_week = at.getUTCDay()
    const hour = at.getUTCHours()
    await prisma.activityBucket.upsert({
      where: { day_of_week_hour: { day_of_week, hour } },
      create: { day_of_week, hour, activity_count: 1 },
      update: { activity_count: { increment: 1 } },
    })
  } catch (err) {
    console.error("recordActivity failed", err)
  }
}

export interface HeatmapCell {
  dayOfWeek: number // 0 = Sunday .. 6 = Saturday
  hour: number // 0 .. 23
  count: number
}

// Full 7×24 grid (missing buckets filled with 0) so the UI can render a
// complete heatmap without gaps.
export async function getActivityHeatmap(): Promise<HeatmapCell[]> {
  const rows = await prisma.activityBucket.findMany({
    select: { day_of_week: true, hour: true, activity_count: true },
  })
  const byKey = new Map(rows.map((r) => [`${r.day_of_week}-${r.hour}`, Number(r.activity_count)]))
  const cells: HeatmapCell[] = []
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      cells.push({ dayOfWeek: d, hour: h, count: byKey.get(`${d}-${h}`) ?? 0 })
    }
  }
  return cells
}

// A plausible engagement curve: quiet overnight, a daytime plateau, an evening
// prime-time peak (~18–22h), with weekends shifted a little later and lighter
// mid-week dips. Deterministic so re-seeding is idempotent.
function sampleCount(dayOfWeek: number, hour: number): number {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  let base: number
  if (hour < 6) base = 40 // overnight
  else if (hour < 11) base = 220 // morning
  else if (hour < 17) base = 320 // daytime plateau
  else if (hour < 23) base = 620 // evening prime time
  else base = 180 // late night
  if (isWeekend) base = Math.round(base * (hour >= 20 ? 1.15 : 0.9))
  // Mild per-hour shaping toward a 20:00 peak.
  const peakBoost = Math.max(0, 1 - Math.abs(hour - 20) / 10)
  return Math.round(base * (0.85 + 0.3 * peakBoost))
}

// Seeds representative sample data (idempotent upsert per bucket). Real
// recordActivity() increments accumulate on top of this over time.
export async function seedActivityHeatmap(): Promise<number> {
  let count = 0
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      await prisma.activityBucket.upsert({
        where: { day_of_week_hour: { day_of_week: d, hour: h } },
        create: { day_of_week: d, hour: h, activity_count: sampleCount(d, h) },
        update: { activity_count: sampleCount(d, h) },
      })
      count++
    }
  }
  return count
}
