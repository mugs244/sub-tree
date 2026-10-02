export interface MomoRequestToPayParams {
  amount: number          // UGX, integer
  phone: string           // normalized Ugandan number (07XXXXXXXX)
  referenceId: string     // UUID — our idempotency key
  payerMessage?: string
  payeeNote?: string
}

export interface MomoRequestToPayResult {
  providerTxId?: string   // not synchronously available for STK push; arrives via webhook
}

export type MomoCallbackPayload = {
  referenceId: string
  status: "SUCCESSFUL" | "FAILED"
  providerTxId?: string
  reason?: string
  // Pesapal only: how it was paid (e.g. "Visa", "MTN UG") and the
  // account_number sent with the order (used for card auto-renew).
  paymentMethod?: string
  accountNumber?: string
}

export interface MomoProvider {
  requestToPay(params: MomoRequestToPayParams): Promise<MomoRequestToPayResult>
  verifyCallback(rawBody: string, signature: string): MomoCallbackPayload | null
}
