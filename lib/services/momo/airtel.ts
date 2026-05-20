// Airtel Money Collections API client
// Docs: https://developers.airtel.africa/payment-apis
//
// Required env vars:
//   AIRTEL_CLIENT_ID         — from Airtel developer portal
//   AIRTEL_CLIENT_SECRET     — from Airtel developer portal
//   AIRTEL_ENVIRONMENT       — "sandbox" | "production"
//   AIRTEL_CALLBACK_URL      — full URL of POST /api/webhooks/momo/airtel

import { createHmac } from "crypto"
import type { MomoProvider, MomoRequestToPayParams, MomoRequestToPayResult, MomoCallbackPayload } from "./types"

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

  const data = (await res.json()) as { access_token: string }
  return data.access_token
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

export const airtelMoney: MomoProvider = { requestToPay, verifyCallback }
