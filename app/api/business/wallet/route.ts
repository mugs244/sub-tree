import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { topUpAdvertiserWallet, listAdvertiserWalletTransactions, AdvertiserWalletError } from "@/lib/services/advertiser-wallet"
import { initiateAdvertiserPayment, AdvertiserPaymentError } from "@/lib/services/advertiser-payment"

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  const transactions = await listAdvertiserWalletTransactions(advertiser.id)
  return NextResponse.json({ data: { balanceUgx: advertiser.wallet_balance_ugx.toString(), transactions } })
}

// Top up the wallet. Real path: create a Pesapal payment and hand back the
// hosted-checkout redirect URL; the IPN webhook credits the wallet on success.
// When Pesapal isn't configured (local/dev), fall back to the manual immediate
// credit so the flow is still exercisable — same graceful-degradation the
// donation/withdrawal chains use.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })
  if (advertiser.role === "EDITOR") {
    return NextResponse.json({ error: "FORBIDDEN", message: "Editors can't top up the wallet" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const { amountUgx, phone } = (body ?? {}) as { amountUgx?: number; phone?: string }
  if (typeof amountUgx !== "number") {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "amountUgx must be a number" }, { status: 400 })
  }

  try {
    const result = await initiateAdvertiserPayment({
      advertiserId: advertiser.id,
      kind: "WALLET_TOPUP",
      amountUgx,
      phone: typeof phone === "string" ? phone : undefined,
    })
    return NextResponse.json({ data: { redirectUrl: result.redirectUrl, paymentId: result.paymentId } }, { status: 202 })
  } catch (err) {
    if (err instanceof AdvertiserPaymentError) {
      if (err.code === "NOT_CONFIGURED") {
        // Dev/local fallback — credit immediately so the wallet still works.
        try {
          await topUpAdvertiserWallet(advertiser.id, amountUgx)
          return NextResponse.json({ data: { ok: true, fallback: true } })
        } catch (e) {
          if (e instanceof AdvertiserWalletError) {
            return NextResponse.json({ error: e.code, message: e.message }, { status: 400 })
          }
          throw e
        }
      }
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
