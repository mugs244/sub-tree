import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser, getPurchasedCredits, getEffectiveCap, PLAN_CAP_MULTIPLIER } from "@/lib/services/advertiser"
import { creditUnitPrice } from "@/lib/services/advertiser-credits"
import { getSettingAsNumber } from "@/lib/services/platform-settings"
import { CreditsPurchase } from "@/components/business/CreditsPurchase"

export default async function BusinessCreditsPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) redirect("/dashboard")

  const [purchased, effectiveCap, unitPrice, baseCap, maxCredits] = await Promise.all([
    getPurchasedCredits(advertiser.id),
    getEffectiveCap(advertiser.id, advertiser.plan),
    creditUnitPrice(),
    getSettingAsNumber("ad_slot_base_cap", 1),
    getSettingAsNumber("ad_slot_credit_max", 20),
  ])

  const planCap = Math.round(baseCap * PLAN_CAP_MULTIPLIER[advertiser.plan])

  return (
    <CreditsPurchase
      plan={advertiser.plan}
      canBuy={advertiser.role !== "EDITOR"}
      walletBalanceUgx={advertiser.wallet_balance_ugx.toString()}
      planCap={planCap}
      purchased={purchased}
      effectiveCap={effectiveCap}
      unitPrice={unitPrice}
      remaining={Math.max(0, maxCredits - purchased)}
    />
  )
}
