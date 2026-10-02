import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getInvoiceForUser } from "@/lib/services/billing"

type Props = { params: Promise<{ number: string }> }

// Invoice status, polled by the Sub-pay page while a payment confirms.
export async function GET(_req: Request, { params }: Props): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  const invoice = await getInvoiceForUser(session.userId, (await params).number)
  if (!invoice) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
  return NextResponse.json({ data: { status: invoice.status, method: invoice.payment_method } })
}
