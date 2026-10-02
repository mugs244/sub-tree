import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { payInvoiceFromWallet, BillingError } from "@/lib/services/billing"

type Props = { params: Promise<{ number: string }> }

// Pay an invoice from the creator's Sub-tree wallet balance.
export async function POST(_req: Request, { params }: Props): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  try {
    await payInvoiceFromWallet(session.userId, (await params).number)
    return NextResponse.json({ data: { status: "PAID" } })
  } catch (err) {
    if (err instanceof BillingError) return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    throw err
  }
}
