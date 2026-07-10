import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { requestClientWithdrawal, ClientWalletError } from "@/lib/services/client-wallet"
import { WithdrawalOtpError } from "@/lib/services/withdrawal-otp"
import { z } from "zod"

const schema = z.object({
  amount: z.number().positive(),
  code: z.string().length(6),
})

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) {
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
    await requestClientWithdrawal(session.userId, parsed.data.amount, parsed.data.code)
    return NextResponse.json({ data: null }, { status: 201 })
  } catch (err) {
    if (err instanceof ClientWalletError || err instanceof WithdrawalOtpError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
