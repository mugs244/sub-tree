import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { requestWithdrawal, WalletError } from "@/lib/services/wallet"
import { z } from "zod"

const schema = z.object({
  amount: z.number().positive(),
})

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
  }

  try {
    await requestWithdrawal(session.userId, parsed.data.amount)
    return NextResponse.json({ data: null }, { status: 201 })
  } catch (err) {
    if (err instanceof WalletError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
