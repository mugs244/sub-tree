// Pesapal v3 Collections client
// Docs: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference
//
// Required env vars:
//   PESAPAL_CONSUMER_KEY      — from Pesapal merchant dashboard
//   PESAPAL_CONSUMER_SECRET   — from Pesapal merchant dashboard
//   PESAPAL_IPN_ID            — UUID returned when you register your IPN URL in the dashboard
//   PESAPAL_ENVIRONMENT       — "sandbox" | "production"
//
// IPN URL to register in Pesapal dashboard:
//   https://sub-tree.vercel.app/api/webhooks/payments/pesapal
//
// Pesapal does NOT do a silent STK push — SubmitOrderRequest returns a
// redirect_url to Pesapal's own hosted checkout page, where the payer picks
// a method (mobile money, card, etc.) and completes payment there. The
// donor must actually be sent to that URL (embedded in an iframe on our
// donate page). See submitOrder() below — requestToPay()/MomoProvider is
// kept only for interface conformance and is NOT used for the real flow.

import type { MomoProvider, MomoRequestToPayParams, MomoRequestToPayResult, MomoCallbackPayload } from "../momo/types"

export interface PesapalOrderResult {
  orderTrackingId?: string
  redirectUrl?: string
}

// Local, not MomoRequestToPayParams — phone is optional because a card payer
// never enters one on our form at all; Pesapal's own hosted checkout collects
// card/billing details directly, so we don't need a valid number to submit.
export interface PesapalOrderParams {
  amount: number
  phone?: string
  referenceId: string
  payerMessage?: string
}

const BASE_URLS: Record<string, string> = {
  sandbox: "https://cybqa.pesapal.com/pesapalv3",
  production: "https://pay.pesapal.com/v3",
}

function baseUrl(): string {
  const env = process.env.PESAPAL_ENVIRONMENT ?? "sandbox"
  return BASE_URLS[env] ?? (BASE_URLS.sandbox as string)
}

async function getToken(): Promise<string> {
  const res = await fetch(`${baseUrl()}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY ?? "",
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET ?? "",
    }),
  })
  if (!res.ok) throw new Error(`Pesapal auth error: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { token?: string; error?: unknown }
  if (data.error || !data.token) throw new Error(`Pesapal auth: ${JSON.stringify(data.error ?? "missing token")}`)
  return data.token
}

// The real entry point for the donation flow — callbackUrl is built per-request
// by the caller (it embeds our idempotency_key so /donate/complete knows which
// donation to show) rather than a single static env var.
export async function submitOrder(params: PesapalOrderParams, callbackUrl: string): Promise<PesapalOrderResult> {
  const token = await getToken()
  // Pesapal expects international format without leading 0 — omitted
  // entirely for card payers, who never provide one on our form
  const phone = params.phone ? "256" + params.phone.replace(/^0/, "") : ""

  const res = await fetch(`${baseUrl()}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      id: params.referenceId,
      currency: "UGX",
      amount: params.amount,
      description: params.payerMessage ?? "Sub-tree donation",
      callback_url: callbackUrl,
      notification_id: process.env.PESAPAL_IPN_ID ?? "",
      billing_address: {
        phone_number: phone,
        country_code: "UG",
        first_name: "Donor",
        last_name: "",
        email_address: "",
        line_1: "",
        line_2: "",
        city: "",
        state: "",
        postal_code: "",
        zip_code: "",
      },
    }),
  })

  if (!res.ok) throw new Error(`Pesapal SubmitOrderRequest error: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { order_tracking_id?: string; redirect_url?: string; error?: unknown }
  if (data.error) throw new Error(`Pesapal SubmitOrderRequest: ${JSON.stringify(data.error)}`)

  return { orderTrackingId: data.order_tracking_id, redirectUrl: data.redirect_url }
}

// Kept only so `pesapal` still satisfies MomoProvider for callers that expect
// the generic STK-push shape — NOT used by the real donation flow, which
// calls submitOrder() directly to capture redirect_url. Uses a generic
// (non-per-donation) callback since nothing currently exercises this path.
async function requestToPay(params: MomoRequestToPayParams): Promise<MomoRequestToPayResult> {
  const result = await submitOrder(params, "https://sub-tree.vercel.app/donate/complete")
  return { providerTxId: result.orderTrackingId }
}

// Called by the webhook route after Pesapal IPN fires
export async function getTransactionStatus(orderTrackingId: string): Promise<MomoCallbackPayload | null> {
  try {
    const token = await getToken()
    const res = await fetch(
      `${baseUrl()}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
    )
    if (!res.ok) return null

    const data = (await res.json()) as {
      payment_status_code?: string
      order_tracking_id?: string
      merchant_reference?: string
      description?: string
    }

    // Pesapal payment_status_code: "00" = completed, "01" = failed, "02" = reversed
    const isSuccess = data.payment_status_code === "00"

    return {
      referenceId: data.merchant_reference ?? orderTrackingId,
      status: isSuccess ? "SUCCESSFUL" : "FAILED",
      providerTxId: data.order_tracking_id,
      reason: isSuccess ? undefined : (data.description ?? "Payment did not complete"),
    }
  } catch {
    return null
  }
}

// Pesapal IPN is a GET request to our webhook URL — verifyCallback is unused
// The webhook route calls getTransactionStatus directly for security
function verifyCallback(_rawBody: string, _signature: string): MomoCallbackPayload | null {
  return null
}

export const pesapal: MomoProvider = { requestToPay, verifyCallback }

// Exposed for system-health checks — fetches an OAuth token only, moves no money.
export { getToken as checkPesapalHealth }
