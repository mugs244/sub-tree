import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { listCreatorTiers } from "@/lib/services/membership-tiers"
import { MembershipTierManager } from "@/components/MembershipTierManager"

export const metadata = { title: "Subscriptions" }

export default async function DashboardSubscriptionsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const tiers = await listCreatorTiers(userId)
  const serializableTiers = tiers.map((tier) => ({
    ...tier,
    price_ugx: Number(tier.price_ugx),
    perks: Array.isArray(tier.perks) ? tier.perks : null,
  }))

  return (
    <main className="px-4 py-5 md:p-8 max-w-5xl">
      <MembershipTierManager initialTiers={serializableTiers} />
    </main>
  )
}
