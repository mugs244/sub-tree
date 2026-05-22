// OpenFloat Collections client
// Docs: https://openfloat.co — contact OpenFloat support for API documentation
//
// Required env vars:
//   OPENFLOAT_API_KEY         — from OpenFloat merchant dashboard
//   OPENFLOAT_WEBHOOK_SECRET  — HMAC-SHA256 secret for webhook signature verification
//   OPENFLOAT_ENVIRONMENT     — "sandbox" | "production"
//
// Webhook URL to register in OpenFloat dashboard:
//   https://sub-tree.vercel.app/api/webhooks/payments/openfloat

import { createHmac, timingSafeEqual } from "crypto"
import type { MomoProvider, MomoRequestToPayParams, MomoRequestToPayResult, MomoCallbackPayload } from "../momo/types"

const BASE_URLS: Record<string, string> = {
  sandbox: "https://sandbox.openfloat.co/api/v1",
  production: "https://api.openfloat.co/api/v1",
}

function baseUrl(): string {
  const env = process.env.OPENFLOAT_ENVIRONMENT ?? "sandbox"
  return BASE_URLS[env] ?? (BASE_URLS.sandbox as string)
}

async function requestToPay(params: MomoRequestToPayParams): Promise<MomoRequestToPayResult> {
  // OpenFloat expects international format without leading 0
  const phone = "256" + params.phone.replace(/^0/, "")

  const res = await fetch(`${baseUrl()}/payments/request`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENFLOAT_API_KEY ?? ""}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      reference: params.referenceId,
      amount: params.amount,
      currency: "UGX",
      phone,
      description: params.payerMessage ?? "Sub-tree donation",
    }),
  })

  if (!res.ok) throw new Error(`OpenFloat requestToPay error: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { transaction_id?: string; id?: string; error?: unknown }
  if (data.error) throw new Error(`OpenFloat requestToPay: ${JSON.stringify(data.error)}`)

  return { providerTxId: data.transaction_id ?? data.id }
}

function verifyCallback(rawBody: string, signature: string): MomoCallbackPayload | null {
  const secret = process.env.OPENFLOAT_WEBHOOK_SECRET
  if (secret) {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
    try {
      if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null
    } catch {
      return null
    }
  }

  try {
    const data = JSON.parse(rawBody) as {
      reference?: string
      transaction_id?: string
      id?: string
      status?: string
      reason?: string
    }

    const referenceId = data.reference ?? ""
    // OpenFloat status values — adjust if their actual values differ
    const isSuccess = data.status === "SUCCESS" || data.status === "SUCCESSFUL" || data.status === "COMPLETED"

    return {
      referenceId,
      status: isSuccess ? "SUCCESSFUL" : "FAILED",
      providerTxId: data.transaction_id ?? data.id,
      reason: data.reason,
    }
  } catch {
    return null
  }
}

export const openFloat: MomoProvider = { requestToPay, verifyCallback }
