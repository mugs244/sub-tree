// OpenFloat Collections + Payouts client
// Docs: https://openfloat.co — contact OpenFloat support for API documentation
//
// Required env vars:
//   OPENFLOAT_API_KEY         — from OpenFloat merchant dashboard
//   OPENFLOAT_WEBHOOK_SECRET  — HMAC-SHA256 secret for webhook signature verification
//   OPENFLOAT_ENVIRONMENT     — "sandbox" | "production"
//
// Webhook URLs to register in OpenFloat dashboard:
//   Collections: https://sub-tree.com/api/webhooks/payments/openfloat
//   Payouts:     https://sub-tree.com/api/webhooks/payments/openfloat/payout
//
// The payout() endpoint path and response shape below are assumed pending
// OpenFloat's actual payout/B2C API docs — adjust once confirmed, same as
// requestToPay above.

import { createHmac, timingSafeEqual } from "crypto"
import type { MomoProvider, MomoRequestToPayParams, MomoRequestToPayResult, MomoCallbackPayload, MomoValidateResult } from "../momo/types"

// Kept local rather than imported from ../momo/types — that file is a
// separate in-progress MTN integration and shouldn't be a dependency for the
// OpenFloat payout path.
export interface OpenFloatPayoutParams {
  amount: number          // UGX, integer
  phone: string           // normalized Ugandan number (07XXXXXXXX)
  referenceId: string     // UUID — our idempotency key
  payerMessage?: string
}

export interface OpenFloatPayoutResult {
  providerTxId?: string
}

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

async function payout(params: OpenFloatPayoutParams): Promise<OpenFloatPayoutResult> {
  // OpenFloat expects international format without leading 0
  const phone = "256" + params.phone.replace(/^0/, "")

  const res = await fetch(`${baseUrl()}/payouts/request`, {
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
      description: params.payerMessage ?? "Sub-tree withdrawal",
    }),
  })

  if (!res.ok) throw new Error(`OpenFloat payout error: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { transaction_id?: string; id?: string; error?: unknown }
  if (data.error) throw new Error(`OpenFloat payout: ${JSON.stringify(data.error)}`)

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

// OpenFloat doesn't expose an account-holder-lookup endpoint (or none has
// been integrated yet) — this only exists so openFloat satisfies
// MomoProvider (added for MTN's validateAccountHolder).
async function validateAccountHolder(_phone: string): Promise<MomoValidateResult> {
  throw new Error("validateAccountHolder is not implemented for OpenFloat yet")
}

export const openFloat: MomoProvider = { requestToPay, verifyCallback, validateAccountHolder }

// Payout side reuses the same signature scheme as collections — separate
// export so the payout webhook route doesn't pull in the (currently
// unimplemented) MomoProvider.validateAccountHolder requirement.
export const openFloatPayout = { payout, verifyCallback }
