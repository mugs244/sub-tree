// Pesapal v3 Collections client
// Docs: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference
//
// Required env vars:
//   PESAPAL_CONSUMER_KEY      — from Pesapal merchant dashboard
//   PESAPAL_CONSUMER_SECRET   — from Pesapal merchant dashboard
//   PESAPAL_IPN_ID            — UUID returned when you register your IPN URL in the dashboard
//   PESAPAL_ENVIRONMENT       — "sandbox" | "production"
//   PESAPAL_CALLBACK_URL      — full URL shown to buyer after payment (e.g. https://sub-tree.vercel.app/donate/complete)
//
// IPN URL to register in Pesapal dashboard:
//   https://sub-tree.vercel.app/api/webhooks/payments/pesapal

import type { MomoProvider, MomoRequestToPayParams, MomoRequestToPayResult, MomoCallbackPayload } from "../momo/types"

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

async function requestToPay(params: MomoRequestToPayParams): Promise<MomoRequestToPayResult> {
  const token = await getToken()
  // Pesapal expects international format without leading 0
  const phone = "256" + params.phone.replace(/^0/, "")

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
      callback_url: process.env.PESAPAL_CALLBACK_URL ?? "",
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
  const data = (await res.json()) as { order_tracking_id?: string; error?: unknown }
  if (data.error) throw new Error(`Pesapal SubmitOrderRequest: ${JSON.stringify(data.error)}`)

  // order_tracking_id is Pesapal's reference; Pesapal triggers STK push to the phone
  return { providerTxId: data.order_tracking_id }
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
