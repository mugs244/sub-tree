import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { listCreatorTiers } from "@/lib/services/membership-tiers"
import { MembershipTierManager } from "@/components/MembershipTierManager"

export const metadata = { title: "Subscriptions" }

export default async function DashboardSubscriptionsPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const tiers = await listCreatorTiers(userId)
  const serializableTiers = tiers.map((tier) => ({
    ...tier,
    price_ugx: Number(tier.price_ugx),
    perks: (Array.isArray(tier.perks) ? tier.perks : null) as string[] | null,
  }))

  return (
    <main className="px-4 py-5 md:p-8 max-w-5xl">
      <MembershipTierManager initialTiers={serializableTiers} />
    </main>
  )
}
