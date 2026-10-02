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

// Config-presence checks for services that cost money or send messages per
// call (Smile ID, email, SMS) — a health check must never trigger those, so
// "configured" is the only signal. Every entry in `envs` must be set; an
// entry like "A|B" is satisfied by either variable.
function configCheck(name: string, envs: string[], okMessage: string, missingMessage: string): Promise<HealthCheckResult> {
  const missing = envs.filter((e) => !e.split("|").some((v) => process.env[v]))
  return Promise.resolve(
    missing.length === 0
      ? { name, status: "ok", latencyMs: null, message: okMessage }
      : { name, status: "unconfigured", latencyMs: null, message: `${missingMessage} Missing: ${missing.join(", ")}` },
  )
}

// Link "Connect" keys. Each check asks the platform whether the keys are
// valid without signing anyone in: Twitch issues an app token for good
// keys; Google answers a dummy code with "invalid_grant" when the client
// is real and "invalid_client" when it isn't.
function checkTwitchConnect(): Promise<HealthCheckResult> {
  const id = process.env.TWITCH_CLIENT_ID
  const secret = process.env.TWITCH_CLIENT_SECRET
  if (!id || !secret) {
    return Promise.resolve({ name: "Twitch connect", status: "unconfigured", latencyMs: null, message: `Missing: ${[!id && "TWITCH_CLIENT_ID", !secret && "TWITCH_CLIENT_SECRET"].filter(Boolean).join(", ")}` })
  }
  return timed("Twitch connect", async () => {
    const res = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: "client_credentials" }),
    })
    if (!res.ok) throw new Error(`Twitch rejected the keys: ${res.status} ${await res.text()}`)
  })
}

function checkYouTubeConnect(): Promise<HealthCheckResult> {
  const id = process.env.YOUTUBE_CLIENT_ID
  const secret = process.env.YOUTUBE_CLIENT_SECRET
  if (!id || !secret) {
    return Promise.resolve({ name: "YouTube connect", status: "unconfigured", latencyMs: null, message: `Missing: ${[!id && "YOUTUBE_CLIENT_ID", !secret && "YOUTUBE_CLIENT_SECRET"].filter(Boolean).join(", ")}` })
  }
  return timed("YouTube connect", async () => {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: id, client_secret: secret, code: "health-check", grant_type: "authorization_code", redirect_uri: "https://sub-tree.com/api/connect/youtube/callback" }),
    })
    const body = (await res.json().catch(() => ({}))) as { error?: string; error_description?: string }
    if (body.error !== "invalid_grant") throw new Error(`Google rejected the keys: ${body.error ?? res.status} ${body.error_description ?? ""}`.trim())
  })
}

export async function runHealthChecks(): Promise<HealthCheckResult[]> {
  return Promise.all([
    checkDatabase(),
    checkMtn(),
    checkAirtel(),
    checkPesapal(),
    checkOpenFloat(),
    configCheck("Smile ID (verification)", ["SMILE_ID_PARTNER_ID", "SMILE_ID_API_KEY"],
      `Configured (${process.env.SMILE_ID_ENV === "production" ? "production" : "sandbox"})`,
      "The verification badge shows 'coming soon' to creators."),
    configCheck("ID review photos", ["ID_IMAGES_KEY"],
      "Encryption key set — 'attention' reviews show ID photos",
      "Reviews won't show photos; use the Smile ID portal."),
    configCheck("Google sign-in (Supabase)", ["NEXT_PUBLIC_SUPABASE_AUTH_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL"],
      "Configured", "Google sign-in shows 'coming soon'."),
    configCheck("Email (Resend)", ["RESEND_API_KEY"], "Configured", "No emails (codes, receipts, alerts) can be sent."),
    configCheck("SMS (eSMS Africa)", ["ESMSAFRICA_API_KEY"],
      "Configured — make sure the account has balance", "No SMS codes or alerts are sent."),
    configCheck("Daily billing cron", ["CRON_SECRET"],
      "Secret set", "The billing cron endpoint isn't protected."),
    checkTwitchConnect(),
    checkYouTubeConnect(),
    checkOgScraper(),
  ])
}
