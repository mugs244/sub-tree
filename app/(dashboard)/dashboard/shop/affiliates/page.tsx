import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { listInboundRequests, listAllAffiliates } from "@/lib/services/affiliate"
import { AffiliatePanel } from "@/components/AffiliatePanel"

const BUSINESS_TIERS = ["BUSINESS", "CONTENT_HOUSE"]

export default async function ShopAffiliatesPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true, tier: true },
  })
  if (!user || !BUSINESS_TIERS.includes(user.tier)) redirect("/dashboard")

  const openProducts = await prisma.product.findMany({
    where: { user_id: user.id, status: "ACTIVE", affiliate_open: true },
    select: { id: true, name: true },
  })

  const [inbound, affiliates] = await Promise.all([
    listInboundRequests(userId),
    listAllAffiliates(userId),
  ])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Affiliate Program</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage creators who promote your products</p>
      </div>
      <AffiliatePanel inbound={inbound} affiliates={affiliates} openProducts={openProducts} />
    </div>
  )
}
