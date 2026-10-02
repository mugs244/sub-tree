import { createHmac, timingSafeEqual } from "node:crypto"

// Smile ID — identity checks for the verification badge.
// Docs: https://docs.usesmileid.com (v3 API + hosted Web SDK).
//
// How it fits together:
//   1. We mint a short-lived token here (POST /v3/token) for one attempt.
//   2. The creator's browser opens Smile ID's hosted widget with it, which
//      collects consent, ID front/back and a selfie + liveness — the images
//      go straight to Smile ID, never through our servers.
//   3. Smile ID POSTs the verdict to our webhook
//      (app/api/webhooks/smile-id/route.ts): clear | attention | block | error.
//
// Env vars:
//   SMILE_ID_PARTNER_ID, SMILE_ID_API_KEY — from the Smile ID portal
//   SMILE_ID_ENV — "sandbox" (default) or "production"
//
// VERIFY IN SANDBOX before going live: the docs describe the token request
// as multipart with user_id / product / payload fields, and call the product
// "document_verification" here but "doc_verification" in the Web SDK. Both
// names are kept in one place below so they're easy to adjust.

export const SMILE_TOKEN_PRODUCT = "document_verification"
export const SMILE_SDK_PRODUCT = "doc_verification"
export const SMILE_SDK_SCRIPT = "https://cdn.usesmileid.com/inline/v12/js/script.min.js"

// Uganda national ID card, per Smile ID's "Verify with document" coverage.
export const SMILE_COUNTRY = "UG"
export const SMILE_ID_TYPE = "IDENTITY_CARD"

interface SmileConfig {
  partnerId: string
  apiKey: string
  sandbox: boolean
  baseUrl: string
}

function config(): SmileConfig | null {
  const partnerId = process.env.SMILE_ID_PARTNER_ID
  const apiKey = process.env.SMILE_ID_API_KEY
  if (!partnerId || !apiKey) return null
  const sandbox = process.env.SMILE_ID_ENV !== "production"
  return {
    partnerId,
    apiKey,
    sandbox,
    baseUrl: sandbox ? "https://testapi.smileidentity.com" : "https://api.smileidentity.com",
  }
}

export function isSmileConfigured(): boolean {
  return config() !== null
}

export interface SmileSession {
  token: string
  partnerId: string
  sandbox: boolean
}

// Mint a token for one verification attempt. smileUserId is our own id for
// the attempt — Smile ID echoes it back in the webhook so we can match it.
export async function mintSmileToken(smileUserId: string, callbackUrl: string): Promise<SmileSession> {
  const c = config()
  if (!c) throw new Error("Smile ID is not configured")

  const form = new FormData()
  form.append("user_id", smileUserId)
  form.append("product", SMILE_TOKEN_PRODUCT)
  form.append("payload", JSON.stringify({ country: SMILE_COUNTRY, id_type: SMILE_ID_TYPE, callback_url: callbackUrl }))

  const res = await fetch(`${c.baseUrl}/v3/token`, {
    method: "POST",
    headers: { "SmileID-Partner-ID": c.partnerId, "SmileID-API-Key": c.apiKey },
    body: form,
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`Smile ID token error: ${res.status} ${await res.text().catch(() => "")}`)
  const data = (await res.json()) as { token?: string }
  if (!data.token) throw new Error("Smile ID token response had no token")
  return { token: data.token, partnerId: c.partnerId, sandbox: c.sandbox }
}

// Webhook check, per Smile ID's docs: Response-Signature is base64
// HMAC-SHA256(api_key, Response-Timestamp + partner_id + "sid_request").
// Note it signs the timestamp, not the body — so callers must also only
// accept results for attempts we started, and we reject stale timestamps.
export function verifySmileWebhook(timestamp: string | null, signature: string | null): boolean {
  const c = config()
  if (!c || !timestamp || !signature) return false

  const age = Math.abs(Date.now() - new Date(timestamp).getTime())
  if (!Number.isFinite(age) || age > 15 * 60 * 1000) return false

  const expected = createHmac("sha256", c.apiKey).update(timestamp + c.partnerId + "sid_request").digest("base64")
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}
