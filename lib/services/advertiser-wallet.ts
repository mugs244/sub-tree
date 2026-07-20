import { prisma } from "@/lib/db"

export class AdvertiserWalletError extends Error {
  constructor(public readonly code: "INVALID_AMOUNT", message: string) {
    super(message)
    this.name = "AdvertiserWalletError"
  }
}

// Real collection (Pesapal/OpenFloat, per the Business Tier spec's Ad-tre
// stack) isn't wired in yet — this is the manual top-up path so the wallet
// can actually be funded and the Ad Slots booking flow exercised end to end
// in the meantime. Swap for a payment-confirmed callback once that lands.
export async function topUpAdvertiserWallet(advertiserId: number, amountUgx: number, note?: string): Promise<void> {
  if (!Number.isFinite(amountUgx) || amountUgx <= 0) {
    throw new AdvertiserWalletError("INVALID_AMOUNT", "Amount must be a positive number")
  }
  const rounded = Math.round(amountUgx)

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${advertiserId})`

    const advertiser = await tx.advertiser.findUniqueOrThrow({ where: { id: advertiserId } })
    const balanceAfter = advertiser.wallet_balance_ugx + BigInt(rounded)

    await tx.advertiser.update({ where: { id: advertiserId }, data: { wallet_balance_ugx: balanceAfter } })
    await tx.advertiserWalletTransaction.create({
      data: {
        advertiser_id: advertiserId,
        type: "TOPUP",
        amount_ugx: rounded,
        balance_after_ugx: balanceAfter,
        note: note ?? "Wallet top-up",
      },
    })
  })
}

export async function listAdvertiserWalletTransactions(advertiserId: number, limit = 20) {
  return prisma.advertiserWalletTransaction.findMany({
    where: { advertiser_id: advertiserId },
    orderBy: { created_at: "desc" },
    take: limit,
  })
}
