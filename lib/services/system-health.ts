import { prisma } from "@/lib/db"
import { fetchSmartCardMeta } from "@/lib/services/smart-links"
import { checkAirtelHealth } from "@/lib/services/momo/airtel"
import { checkPesapalHealth } from "@/lib/services/payments/pesapal"

const MTN_BASE_URLS: Record<string, string> = {
  sandbox: "https://sandbox.momodeveloper.mtn.com",
  mtnuganda: "https://proxy.momoapi.mtn.com",
}

// Self-contained rather than imported from lib/services/momo/mtn.ts, so this
// check doesn't depend on that file's export surface — fetches an OAuth
// token only, moves no money.
async function checkMtnHealth(): Promise<void> {
  const env = process.env.MTN_MOMO_ENVIRONMENT ?? "sandbox"
  const baseUrl = MTN_BASE_URLS[env] ?? MTN_BASE_URLS.sandbox
  const credentials = Buffer.from(
    `${process.env.MTN_MOMO_API_USER}:${process.env.MTN_MOMO_API_KEY}`,
  ).toString("base64")

  const res = await fetch(`${baseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": process.env.MTN_MOMO_SUBSCRIPTION_KEY ?? "",
      "X-Target-Environment": env,
    },
  })

  if (!res.ok) throw new Error(`MTN MoMo token error: ${res.status} ${await res.text()}`)
}

export type HealthStatus = "ok" | "down" | "unconfigured"

export interface HealthCheckResult {
  name: string
  status: HealthStatus
  latencyMs: number | null
  message?: string
}

async function timed(name: string, fn: () => Promise<void>): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    await fn()
    return { name, status: "ok", latencyMs: Date.now() - start }
  } catch (err) {
    return {
      name,
      status: "down",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : String(err),
    }
  }
}

function checkDatabase(): Promise<HealthCheckResult> {
  return timed("Database", async () => {
    await prisma.$queryRaw`SELECT 1`
  })
}

function checkMtn(): Promise<HealthCheckResult> {
  if (!process.env.MTN_MOMO_API_USER || !process.env.MTN_MOMO_API_KEY) {
    return Promise.resolve({ name: "MTN MoMo", status: "unconfigured", latencyMs: null })
  }
  return timed("MTN MoMo", async () => {
    await checkMtnHealth()
  })
}

function checkAirtel(): Promise<HealthCheckResult> {
  if (!process.env.AIRTEL_CLIENT_ID || !process.env.AIRTEL_CLIENT_SECRET) {
    return Promise.resolve({ name: "Airtel Money", status: "unconfigured", latencyMs: null })
  }
  return timed("Airtel Money", async () => {
    await checkAirtelHealth()
  })
}

function checkPesapal(): Promise<HealthCheckResult> {
  if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
    return Promise.resolve({ name: "Pesapal", status: "unconfigured", latencyMs: null })
  }
  return timed("Pesapal", async () => {
    await checkPesapalHealth()
  })
}

// OpenFloat has no OAuth handshake or documented status endpoint — a real
// request would have to hit the money-moving /payments/request route, which
// a health check must never call. Config presence is the only safe signal.
function checkOpenFloat(): Promise<HealthCheckResult> {
  if (!process.env.OPENFLOAT_API_KEY) {
    return Promise.resolve({ name: "OpenFloat", status: "unconfigured", latencyMs: null })
  }
  return Promise.resolve({
    name: "OpenFloat",
    status: "ok",
    latencyMs: null,
    message: "API key configured — no safe endpoint available to verify reachability",
  })
}

function checkOgScraper(): Promise<HealthCheckResult> {
  return timed("Open Graph scraper", async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sub-tree.com"
    const meta = await fetchSmartCardMeta(baseUrl)
    if (!meta) throw new Error("Scrape returned no metadata")
  })
}

export async function runHealthChecks(): Promise<HealthCheckResult[]> {
  return Promise.all([
    checkDatabase(),
    checkMtn(),
    checkAirtel(),
    checkPesapal(),
    checkOpenFloat(),
    checkOgScraper(),
  ])
}
