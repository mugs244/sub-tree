import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { adminMarkInvoicePaid, adminVoidInvoice, BillingError } from "@/lib/services/billing"

const schema = z.object({ action: z.enum(["mark_paid", "void"]) })
type Props = { params: Promise<{ id: string }> }

// Mark an open invoice paid (payment taken outside Sub-pay) or void it.
export async function POST(req: Request, { params }: Props): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const id = Number((await params).id)
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!Number.isInteger(id) || !parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })

  try {
    if (parsed.data.action === "mark_paid") await adminMarkInvoicePaid(id)
    else await adminVoidInvoice(id)
    return NextResponse.json({ data: null })
  } catch (err) {
    if (err instanceof BillingError) return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    throw err
  }
}
