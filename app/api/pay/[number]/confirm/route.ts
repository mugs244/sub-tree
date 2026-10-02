import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { confirmPesapalReturn, getInvoiceForUser } from "@/lib/services/billing"

const schema = z.object({ orderTrackingId: z.string().min(1) })
type Props = { params: Promise<{ number: string }> }

// Called when Pesapal's checkout returns: asks Pesapal for the result right
// away instead of waiting for the IPN (both paths are safe to run).
export async function POST(req: Request, { params }: Props): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })

  const number = (await params).number
  await confirmPesapalReturn(session.userId, number, parsed.data.orderTrackingId)
  const invoice = await getInvoiceForUser(session.userId, number)
  return NextResponse.json({ data: { status: invoice?.status ?? "OPEN" } })
}
