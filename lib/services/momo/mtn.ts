// MTN MoMo Collections API client
// Docs: https://momodeveloper.mtn.com/docs/services/collection
//
// Required env vars:
//   MTN_MOMO_SUBSCRIPTION_KEY   — Ocp-Apim-Subscription-Key from developer portal
//   MTN_MOMO_API_USER           — UUID created via POST /v1_0/apiuser
//   MTN_MOMO_API_KEY            — key from POST /v1_0/apiuser/{apiUserId}/apikey
//   MTN_MOMO_ENVIRONMENT        — "sandbox" | "mtnuganda" (prod)
//   MTN_MOMO_CALLBACK_URL       — full URL of POST /api/webhooks/momo/mtn

import { createHmac } from "crypto"
import type { MomoProvider, MomoRequestToPayParams, MomoRequestToPayResult, MomoCallbackPayload } from "./types"

const BASE_URLS: Record<string, string> = {
  sandbox: "https://sandbox.momodeveloper.mtn.com",
  mtnuganda: "https://proxy.momoapi.mtn.com",
}

async function getAccessToken(): Promise<string> {
  const env = process.env.MTN_MOMO_ENVIRONMENT ?? "sandbox"
  const baseUrl = BASE_URLS[env] ?? BASE_URLS.sandbox
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

  if (!res.ok) {
    throw new Error(`MTN MoMo token error: ${res.status} ${await res.text()}`)
  }

  let data: unknown
  try {
    data = await res.json()
  } catch (err) {
    throw new Error(`MTN MoMo token parse error: ${await res.text()}`)
  }

  const payload = data as { access_token?: unknown }
  if (typeof payload.access_token !== "string" || !payload.access_token.trim()) {
    throw new Error(`MTN MoMo token error: missing or empty access_token`)
  }

  return payload.access_token
}

async function requestToPay(params: MomoRequestToPayParams): Promise<MomoRequestToPayResult> {
  const env = process.env.MTN_MOMO_ENVIRONMENT ?? "sandbox"
  const baseUrl = BASE_URLS[env] ?? BASE_URLS.sandbox
  const token = await getAccessToken()

  // MTN expects international format without leading 0
  const internationalPhone = "256" + params.phone.replace(/^0/, "")

  const res = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Reference-Id": params.referenceId,
      "X-Target-Environment": env,
      "Ocp-Apim-Subscription-Key": process.env.MTN_MOMO_SUBSCRIPTION_KEY ?? "",
      "X-Callback-Url": process.env.MTN_MOMO_CALLBACK_URL ?? "",
    },
    body: JSON.stringify({
      amount: String(params.amount),
      currency: "UGX",
      externalId: params.referenceId,
      payer: { partyIdType: "MSISDN", partyId: internationalPhone },
      payerMessage: params.payerMessage ?? "Sub-tree donation",
      payeeNote: params.payeeNote ?? "Thank you",
    }),
  })

  if (!res.ok && res.status !== 202) {
    throw new Error(`MTN MoMo requestToPay error: ${res.status} ${await res.text()}`)
  }

  // Fetch transaction status to get the provider's transaction ID
  const getRes = await fetch(`${baseUrl}/collection/v1_0/requesttopay/${params.referenceId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Target-Environment": env,
      "Ocp-Apim-Subscription-Key": process.env.MTN_MOMO_SUBSCRIPTION_KEY ?? "",
    },
  })

  let providerTxId: string | undefined
  if (getRes.ok) {
    try {
      const txData = (await getRes.json()) as { financialTransactionId?: string }
      providerTxId = txData.financialTransactionId
    } catch {
      // Silently fail if we can't fetch the transaction details
    }
  }

  return { providerTxId }
}

function verifyCallback(rawBody: string, signature: string): MomoCallbackPayload | null {
  // MTN sends HMAC-SHA256 in X-Callback-Signature header
  const secret = process.env.MTN_MOMO_CALLBACK_SECRET
  if (secret) {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
    if (expected !== signature) return null
  }

  try {
    const data = JSON.parse(rawBody) as {
      referenceId?: string
      externalId?: string
      status?: string
      financialTransactionId?: string
      reason?: { code?: string; message?: string }
    }

    const referenceId = data.referenceId ?? data.externalId ?? ""
    const isSuccess = data.status === "SUCCESSFUL"

    return {
      referenceId,
      status: isSuccess ? "SUCCESSFUL" : "FAILED",
      providerTxId: data.financialTransactionId,
      reason: data.reason?.message,
    }
  } catch {
    return null
  }
}

export const mtnMomo: MomoProvider = { requestToPay, verifyCallback }
