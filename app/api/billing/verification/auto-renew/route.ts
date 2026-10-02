import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { setWalletAutoRenew } from "@/lib/services/billing"

const schema = z.object({ wallet: z.boolean() })

// Turn renewing from the Sub-tree wallet on or off. (Card auto-renew is
// switched on inside Pesapal's checkout and managed through Pesapal.)
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })

  await setWalletAutoRenew(session.userId, parsed.data.wallet)
  return NextResponse.json({ data: { wallet: parsed.data.wallet } })
}
