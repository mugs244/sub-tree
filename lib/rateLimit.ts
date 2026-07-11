// In-memory sliding window rate limiter.
// Works for single-instance deployments (Render free/starter).
// Replace with Upstash Redis when scaling to multiple instances.

import { randomUUID } from "crypto"

interface RateLimitEntry {
  timestamps: number[]
}

// x-forwarded-for can be a comma-separated proxy chain — the client is the
// first entry. Falls back to a fresh per-request id, NOT a shared "unknown"
// literal — a shared fallback means every request without these headers
// (any local dev request, or any misconfigured proxy) collapses into one
// bucket and rate-limits unrelated visitors against each other. A random
// per-request id is effectively unlimited for that one request instead,
// which is the safer failure mode for a rate limiter.
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  const first = forwarded?.split(",")[0]?.trim()
  if (first) return first

  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp

  return `unidentified:${randomUUID()}`
}

const store = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  windowMs: number  // window size in milliseconds
  max: number       // max requests per window
}

export function checkRateLimit(key: string, options: RateLimitOptions): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const { windowMs, max } = options

  const entry = store.get(key) ?? { timestamps: [] }

  // Drop timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)

  if (entry.timestamps.length >= max) {
    const oldest = entry.timestamps[0]!
    const retryAfterMs = windowMs - (now - oldest)
    store.set(key, entry)
    return { allowed: false, retryAfterMs }
  }

  entry.timestamps.push(now)
  store.set(key, entry)
  return { allowed: true, retryAfterMs: 0 }
}
