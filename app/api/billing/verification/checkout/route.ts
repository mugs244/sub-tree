import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { createVerificationInvoice, invoiceNumber } from "@/lib/services/billing"

const schema = z.object({ plan: z.enum(["MONTHLY", "ANNUAL"]) })

// Creates (or updates) the creator's open verification invoice for the plan
// they picked, and returns its number for the Sub-pay page.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR", message: "Choose a plan" }, { status: 400 })

  const invoice = await createVerificationInvoice(session.userId, parsed.data.plan)
  return NextResponse.json({ data: { number: invoiceNumber(invoice.id) } })
}
