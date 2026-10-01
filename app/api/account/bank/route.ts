import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { UGANDA_BANKS } from "@/lib/banks"
import { verifyWithdrawalOtp, WithdrawalOtpError } from "@/lib/services/withdrawal-otp"
import { notifyBankDetailsChanged } from "@/lib/services/security-notify"

const schema = z.object({
  code: z.string().length(6),
  bank_name: z.enum(UGANDA_BANKS),
  account_name: z.string().trim().min(2, "Enter the name on the account").max(80),
  account_number: z.string().trim().regex(/^\d{6,20}$/, "Account number should be 6–20 digits"),
})

// Step 2 of saving bank details: check the emailed code, then save. The
// owner also gets an email + SMS alert, since this decides where money goes.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
  }

  try {
    await verifyWithdrawalOtp(session.userId, parsed.data.code, "BANK_DETAILS")
  } catch (err) {
    if (err instanceof WithdrawalOtpError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      bank_name: parsed.data.bank_name,
      bank_account_name: parsed.data.account_name,
      bank_account_number: parsed.data.account_number,
      bank_details_updated_at: new Date(),
    },
  })
  await notifyBankDetailsChanged(session.userId, parsed.data.bank_name, parsed.data.account_number.slice(-4))

  return NextResponse.json({ data: { ok: true } })
}
