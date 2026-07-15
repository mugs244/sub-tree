// Vercel Web Analytics REST API — real traffic data for admin analytics.
// Docs: https://vercel.com/docs/analytics (Query Web Analytics with the API)
//
// Required env var:
//   VERCEL_ANALYTICS_TOKEN — vercel.com/account/tokens, scoped to the team
//
// Project/team are hardcoded below — not secrets, just IDs for this one
// deployment (confirmed via `vercel project inspect sub-tree`).
//
// Note: bounce rate is NOT available here — it's a session-level metric
// Vercel's own dashboard computes internally, and `sessionId`/`visitorId`
// aren't valid `by`/`filter` dimensions on this endpoint (confirmed against
// the REST API reference), so there's no way to derive it from these
// aggregate counts. Don't approximate it — that would just be wrong data.

const PROJECT_ID = "prj_qbF2wTwQb2gv7nMdjIPl0s6AJ3mM"
const TEAM_SLUG = "mugs244s-projects"
const BASE_URL = "https://api.vercel.com/v1/query/web-analytics"

interface CountResponse {
  data: { pageviews: number; visitors: number }
}

interface DailyRow {
  timestamp: string
  pageviews: number
  visitors: number
}

interface DimensionRow {
  pageviews: number
  visitors: number
  [dimension: string]: string | number
}

export interface BreakdownItem {
  label: string
  visitors: number
  pageviews: number
  /** Share of visitors across this breakdown's own rows (top-N + "Others"), 0–100. */
  pct: number
}

async function query<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN
  if (!token) return null

  const search = new URLSearchParams({ slug: TEAM_SLUG, projectId: PROJECT_ID, ...params })

  try {
    const res = await fetch(`${BASE_URL}/${path}?${search.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      // Admin dashboard page — a minute of staleness is fine, avoids
      // hammering the API on every refresh.
      next: { revalidate: 60 },
    })
    if (!res.ok) {
      console.error("Vercel Analytics query failed", { path, status: res.status, body: await res.text() })
      return null
    }
    const json = (await res.json()) as { data: T }
    return json.data
  } catch (err) {
    console.error("Vercel Analytics query error", { path, err })
    return null
  }
}

// The API defaults `since`/`until` when BOTH are omitted, but 400s with
// "missing required property `until`" if only `since` is given — so any call
// that scopes the range has to pass both explicitly.
function dateRange(days: number): { since: string; until: string } {
  const until = new Date()
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000)
  return { since: since.toISOString().slice(0, 10), until: until.toISOString().slice(0, 10) }
}

async function getBreakdown(dimension: string, days: number, limit: number): Promise<BreakdownItem[]> {
  const data = await query<DimensionRow[]>("visits/aggregate", {
    ...dateRange(days),
    by: dimension,
    limit: String(limit),
  })
  if (!data) return []

  const totalVisitors = data.reduce((sum, row) => sum + row.visitors, 0)
  return data
    .filter((row) => row[dimension])
    .map((row) => ({
      label: String(row[dimension]),
      visitors: row.visitors,
      pageviews: row.pageviews,
      pct: totalVisitors > 0 ? Math.round((row.visitors / totalVisitors) * 1000) / 10 : 0,
    }))
}

export async function getTrafficTotals(days = 30): Promise<{ pageviews: number; visitors: number } | null> {
  const data = await query<CountResponse["data"]>("visits/count", dateRange(days))
  return data
}

export async function getDailyTraffic(days = 14): Promise<DailyRow[]> {
  const data = await query<DailyRow[]>("visits/aggregate", { ...dateRange(days), by: "day" })
  return data ?? []
}

export const getTopPages = (days = 30, limit = 8) => getBreakdown("requestPath", days, limit)
export const getTopReferrers = (days = 30, limit = 8) => getBreakdown("referrerHostname", days, limit)
export const getDeviceBreakdown = (days = 30, limit = 5) => getBreakdown("deviceType", days, limit)
export const getOsBreakdown = (days = 30, limit = 5) => getBreakdown("osName", days, limit)
export const getBrowserBreakdown = (days = 30, limit = 5) => getBreakdown("browserName", days, limit)
export const getUtmSourceBreakdown = (days = 30, limit = 8) => getBreakdown("utmSource", days, limit)
