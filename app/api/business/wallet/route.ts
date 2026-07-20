import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { topUpAdvertiserWallet, listAdvertiserWalletTransactions, AdvertiserWalletError } from "@/lib/services/advertiser-wallet"

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  const transactions = await listAdvertiserWalletTransactions(advertiser.id)
  return NextResponse.json({ data: { balanceUgx: advertiser.wallet_balance_ugx.toString(), transactions } })
}

// Manual top-up until real MoMo/Pesapal collection is wired in for
// advertisers — see lib/services/advertiser-wallet.ts.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const { amountUgx } = (body ?? {}) as { amountUgx?: number }
  if (typeof amountUgx !== "number") {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "amountUgx must be a number" }, { status: 400 })
  }

  try {
    await topUpAdvertiserWallet(advertiser.id, amountUgx)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    if (err instanceof AdvertiserWalletError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
