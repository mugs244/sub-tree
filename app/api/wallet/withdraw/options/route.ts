import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { getClientBalance, getPayoutOptions, maskPhone } from "@/lib/services/client-wallet"
import { getFeeRate } from "@/lib/services/platform-settings"

function maskEmail(email: string): string {
  const [user, domain] = email.split("@")
  if (!user || !domain) return email
  return `${user.slice(0, 2)}${"•".repeat(Math.max(1, Math.min(6, user.length - 2)))}@${domain}`
}

// Everything the withdraw flow needs before the creator picks anything:
// balance, live fee rates, their saved payout destinations, and where a
// code can be sent (email always; SMS only if the account has a phone).
export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  const userId = session.userId

  const [balance, destinations, creatorFeeRate, processorFeeRate, user] = await Promise.all([
    getClientBalance(userId),
    getPayoutOptions(userId),
    getFeeRate("fee_withdrawal_creator", 0.02),
    getFeeRate("fee_withdrawal_processor", 0.01),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, phone: true } }),
  ])

  return NextResponse.json({
    data: {
      available: Math.max(0, Math.floor(balance.available)),
      creatorFeeRate,
      processorFeeRate,
      mobileMoney: destinations.mobileMoney ? { masked: destinations.mobileMoney.masked } : null,
      bank: destinations.bank,
      channels: {
        email: user?.email ? maskEmail(user.email) : null,
        sms: user?.phone ? maskPhone(user.phone) : null,
      },
    },
  })
}
