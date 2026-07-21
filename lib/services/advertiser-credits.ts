import { prisma } from "@/lib/db"
import { getSettingAsNumber } from "@/lib/services/platform-settings"

export class AdvertiserCreditError extends Error {
  constructor(
    public readonly code: "INVALID_QUANTITY" | "LIMIT_REACHED" | "INSUFFICIENT_BALANCE",
    message: string,
  ) {
    super(message)
    this.name = "AdvertiserCreditError"
  }
}

export async function creditUnitPrice(): Promise<number> {
  return getSettingAsNumber("ad_slot_credit_price", 100_000)
}

// Additional caps are deliberately "limited" per the Business Tier spec —
// an advertiser can't buy an unbounded number, so overflow still defers
// instead of the platform over-serving. Cap the lifetime purchased total.
async function maxPurchasedCredits(): Promise<number> {
  return getSettingAsNumber("ad_slot_credit_max", 20)
}

export async function buyCredits(advertiserId: number, quantity: number): Promise<{ chargedUgx: number; credits: number }> {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new AdvertiserCreditError("INVALID_QUANTITY", "Choose how many additional caps to buy")
  }

  const [unitPrice, maxCredits] = await Promise.all([creditUnitPrice(), maxPurchasedCredits()])
  const charge = unitPrice * quantity

  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${advertiserId})`

    const existing = await tx.advertiserCreditPurchase.aggregate({
      where: { advertiser_id: advertiserId },
      _sum: { credits: true },
    })
    const alreadyBought = existing._sum.credits ?? 0
    if (alreadyBought + quantity > maxCredits) {
      throw new AdvertiserCreditError(
        "LIMIT_REACHED",
        `You can buy up to ${maxCredits} additional caps in total — you already have ${alreadyBought}`,
      )
    }

    const advertiser = await tx.advertiser.findUniqueOrThrow({ where: { id: advertiserId } })
    if (advertiser.wallet_balance_ugx < BigInt(charge)) {
      throw new AdvertiserCreditError(
        "INSUFFICIENT_BALANCE",
        `Only UGX ${advertiser.wallet_balance_ugx.toLocaleString()} available — top up to buy these caps`,
      )
    }

    const balanceAfter = advertiser.wallet_balance_ugx - BigInt(charge)

    await tx.advertiserCreditPurchase.create({
      data: { advertiser_id: advertiserId, credits: quantity, price_ugx: charge },
    })
    await tx.advertiser.update({ where: { id: advertiserId }, data: { wallet_balance_ugx: balanceAfter } })
    await tx.advertiserWalletTransaction.create({
      data: {
        advertiser_id: advertiserId,
        type: "CREDIT_PURCHASE",
        amount_ugx: -charge,
        balance_after_ugx: balanceAfter,
        note: `${quantity} additional cap(s) purchased`,
      },
    })

    return { chargedUgx: charge, credits: quantity }
  })

  return result
}
