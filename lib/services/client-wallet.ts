import { prisma } from "@/lib/db"
import { getRateHistory, rateAtTime } from "@/lib/services/platform-settings"

export class ClientWalletError extends Error {
  constructor(
    public readonly code: "INVALID_AMOUNT" | "INSUFFICIENT_BALANCE",
    message: string,
  ) {
    super(message)
    this.name = "ClientWalletError"
  }
}

interface DonationRow {
  amount: number
  created_at: Date
  fundraiser_id: number | null
  creator_amount: number | null
}

// Donations completed before platform_fee/creator_amount existed have no
// stored split — fall back to the same historical-rate estimate the admin
// Wallet page uses, so old donations still count toward the creator's balance.
async function creatorShareOf(donations: DonationRow[]): Promise<number> {
  const direct = donations.filter((d) => d.fundraiser_id === null && d.creator_amount === null)
  const fundraiser = donations.filter((d) => d.fundraiser_id !== null && d.creator_amount === null)

  const [directPeriods, fundraiserPeriods] = await Promise.all([
    direct.length > 0 ? getRateHistory("fee_donation_free", 0.05) : null,
    fundraiser.length > 0 ? getRateHistory("fee_fundraiser_free", 0.05) : null,
  ])

  return donations.reduce((sum, d) => {
    if (d.creator_amount !== null) return sum + d.creator_amount
    const periods = d.fundraiser_id === null ? directPeriods! : fundraiserPeriods!
    const rate = rateAtTime(periods, d.created_at)
    return sum + Math.round(d.amount * (1 - rate))
  }, 0)
}

async function getWithdrawnTotal(userId: number): Promise<number> {
  const agg = await prisma.clientWithdrawal.aggregate({
    where: { user_id: userId, status: { in: ["PENDING", "COMPLETED"] } },
    _sum: { amount: true },
  })
  return agg._sum.amount ?? 0
}

export async function getClientBalance(userId: number): Promise<{ earned: number; withdrawn: number; available: number }> {
  const donations = await prisma.donation.findMany({
    where: { user_id: userId, status: "COMPLETED" },
    select: { amount: true, created_at: true, fundraiser_id: true, creator_amount: true },
  })

  const [earned, withdrawn] = await Promise.all([
    creatorShareOf(donations),
    getWithdrawnTotal(userId),
  ])

  return { earned, withdrawn, available: earned - withdrawn }
}

export async function listClientWithdrawals(userId: number, limit = 20) {
  return prisma.clientWithdrawal.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: limit,
    select: { id: true, amount: true, status: true, created_at: true, completed_at: true },
  })
}

// Records the request only — no OpenFloat payout call yet, same as the admin
// wallet, until that integration is provided.
export async function requestClientWithdrawal(userId: number, amountUgx: number): Promise<void> {
  if (!Number.isFinite(amountUgx) || amountUgx <= 0) {
    throw new ClientWalletError("INVALID_AMOUNT", "Amount must be a positive number")
  }

  const { available } = await getClientBalance(userId)
  if (amountUgx > available) {
    throw new ClientWalletError(
      "INSUFFICIENT_BALANCE",
      `Only UGX ${Math.round(available).toLocaleString()} is available to withdraw`,
    )
  }

  await prisma.clientWithdrawal.create({
    data: {
      amount: Math.round(amountUgx),
      user_id: userId,
    },
  })
}
