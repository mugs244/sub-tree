import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { sendBankDetailsOtp, WithdrawalOtpError } from "@/lib/services/withdrawal-otp"

// Step 1 of saving bank details: email the account owner a code.
export async function POST(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  try {
    await sendBankDetailsOtp(session.userId)
    return NextResponse.json({ data: null })
  } catch (err) {
    if (err instanceof WithdrawalOtpError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
