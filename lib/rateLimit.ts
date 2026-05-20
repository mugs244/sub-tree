// In-memory sliding window rate limiter.
// Works for single-instance deployments (Render free/starter).
// Replace with Upstash Redis when scaling to multiple instances.

interface RateLimitEntry {
  timestamps: number[]
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
