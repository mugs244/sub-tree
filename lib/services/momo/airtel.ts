// Airtel Money Collections API client
// Docs: https://developers.airtel.africa/payment-apis
//
// Required env vars:
//   AIRTEL_CLIENT_ID         — from Airtel developer portal
//   AIRTEL_CLIENT_SECRET     — from Airtel developer portal
//   AIRTEL_ENVIRONMENT       — "sandbox" | "production"
//   AIRTEL_CALLBACK_URL      — full URL of POST /api/webhooks/momo/airtel

import { createHmac } from "crypto"
import type { MomoProvider, MomoRequestToPayParams, MomoRequestToPayResult, MomoCallbackPayload, MomoValidateResult } from "./types"

const BASE_URLS: Record<string, string> = {
  sandbox: "https://openapiuat.airtel.africa",
  production: "https://openapi.airtel.africa",
}

async function getAccessToken(): Promise<string> {
  const env = process.env.AIRTEL_ENVIRONMENT ?? "sandbox"
  const baseUrl = BASE_URLS[env] ?? BASE_URLS.sandbox

  const res = await fetch(`${baseUrl}/auth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.AIRTEL_CLIENT_ID,
      client_secret: process.env.AIRTEL_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  })

  if (!res.ok) {
    throw new Error(`Airtel token error: ${res.status} ${await res.text()}`)
  }

  let data: unknown
  try {
    data = await res.json()
  } catch (err) {
    throw new Error(`Airtel token parse error: ${await res.text()}`)
  }

  const payload = data as { access_token?: unknown }
  if (typeof payload.access_token !== "string" || !payload.access_token.trim()) {
    throw new Error(`Airtel token error: missing or empty access_token`)
  }

  return payload.access_token
}

async function requestToPay(params: MomoRequestToPayParams): Promise<MomoRequestToPayResult> {
  const env = process.env.AIRTEL_ENVIRONMENT ?? "sandbox"
  const baseUrl = BASE_URLS[env] ?? BASE_URLS.sandbox
  const token = await getAccessToken()

  // Airtel expects MSISDN without country code prefix (07XXXXXXXX)
  const msisdn = params.phone.startsWith("0") ? params.phone : `0${params.phone}`

  const res = await fetch(`${baseUrl}/merchant/v2/payments/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Country": "UG",
      "X-Currency": "UGX",
    },
    body: JSON.stringify({
      reference: params.referenceId,
      subscriber: { country: "UG", currency: "UGX", msisdn },
      transaction: {
        amount: params.amount,
        country: "UG",
        currency: "UGX",
        id: params.referenceId,
      },
    }),
  })

  if (!res.ok) {
    throw new Error(`Airtel requestToPay error: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as { data?: { transaction?: { id?: string; airtel_money_id?: string } } }
  const providerTxId = data.data?.transaction?.airtel_money_id ?? params.referenceId

  return { providerTxId }
}

function verifyCallback(rawBody: string, signature: string): MomoCallbackPayload | null {
  const secret = process.env.AIRTEL_CALLBACK_SECRET
  if (secret) {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
    if (expected !== signature) return null
  }

  try {
    const data = JSON.parse(rawBody) as {
      transaction?: {
        id?: string
        airtel_money_id?: string
        status?: string
        message?: string
      }
    }

    const tx = data.transaction
    if (!tx) return null

    return {
      referenceId: tx.id ?? "",
      status: tx.status === "TS" ? "SUCCESSFUL" : "FAILED",
      providerTxId: tx.airtel_money_id,
      reason: tx.message,
    }
  } catch {
    return null
  }
}

// Airtel's equivalent KYC-lookup endpoint hasn't been integrated yet — this
// is here only so airtelMoney satisfies MomoProvider (added for MTN's
// validateAccountHolder); callers should not route Airtel numbers through it.
async function validateAccountHolder(_phone: string): Promise<MomoValidateResult> {
  throw new Error("validateAccountHolder is not implemented for Airtel Money yet")
}

export const airtelMoney: MomoProvider = { requestToPay, verifyCallback, validateAccountHolder }

// Exposed for system-health checks — fetches an OAuth token only, moves no money.
export { getAccessToken as checkAirtelHealth }
