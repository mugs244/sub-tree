import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import {
  listInboundRequests,
  listAllAffiliates,
  listOldAffiliates,
  listMyShops,
  getEarnings,
} from "@/lib/services/affiliate"
import { AffiliatePanel } from "@/components/AffiliatePanel"
import { AffiliateTabs } from "@/components/AffiliateTabs"
import { CopyButton } from "@/components/CopyButton"

const PRO_TIERS      = ["PRO", "BUSINESS", "CONTENT_HOUSE"]
const MERCHANT_TIERS = ["BUSINESS", "CONTENT_HOUSE"]

function formatUGX(n: bigint) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(Number(n))
}

export default async function AffiliatesPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true, tier: true, username: true },
  })
  if (!user || !PRO_TIERS.includes(user.tier)) redirect("/dashboard")

  const isMerchant = MERCHANT_TIERS.includes(user.tier)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sub-tree.com"

  const [shops, earnings] = await Promise.all([listMyShops(userId), getEarnings(userId)])

  let inbound:       Awaited<ReturnType<typeof listInboundRequests>> = []
  let affiliates:    Awaited<ReturnType<typeof listAllAffiliates>>   = []
  let oldAffiliates: Awaited<ReturnType<typeof listOldAffiliates>>   = []
  let openProducts:  { id: number; name: string }[]                  = []

  if (isMerchant) {
    ;[inbound, affiliates, oldAffiliates, openProducts] = await Promise.all([
      listInboundRequests(userId),
      listAllAffiliates(userId),
      listOldAffiliates(userId),
      prisma.product.findMany({
        where: { user_id: user.id, status: "ACTIVE", affiliate_open: true },
        select: { id: true, name: true },
      }),
    ])
  }

  const promoterSection = (
    <div className="space-y-5">
      <div className="bg-background border border-border rounded-xl p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Earnings</p>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-base font-semibold">{formatUGX(earnings.pending_amount)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Pending payout</p>
          </div>
          <div>
            <p className="text-base font-semibold">{formatUGX(earnings.paid_amount)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Paid to date</p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-3">
          Minimum payout UGX 5,000 · Paid every Monday
        </p>
      </div>

      {shops.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-muted-foreground">No approved affiliate relationships yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Visit a Business shop and apply to become an affiliate.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                {shop.shop_user.profile?.avatar_url && (
                  <img src={shop.shop_user.profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                )}
                <div>
                  <p className="text-sm font-medium">{shop.shop_user.profile?.display_name ?? shop.shop_user.username}</p>
                  <p className="text-xs text-muted-foreground">@{shop.shop_user.username}</p>
                </div>
              </div>
              {shop.product_grants.length === 0 ? (
                <p className="text-xs text-muted-foreground">No products granted yet.</p>
              ) : (
                <div className="space-y-2">
                  {shop.product_grants.map(({ product: p }) => {
                    const affiliateUrl = `${baseUrl}/${shop.shop_user.username}/shop/${p.id}?ref=${user.username}`
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-3 py-2 border-t border-border first:border-0 first:pt-0">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatUGX(p.price)} · {Math.round(Number(p.affiliate_rate) * 100)}% commission
                          </p>
                        </div>
                        <CopyButton text={affiliateUrl} label="Copy link" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  if (!isMerchant) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-lg font-semibold">My Commissions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Shops you promote and your earnings</p>
        </div>
        {promoterSection}
      </div>
    )
  }

  const merchantSection = (
    <AffiliatePanel
      inbound={inbound}
      affiliates={affiliates}
      old={oldAffiliates}
      openProducts={openProducts}
    />
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-lg font-semibold">Affiliates</h1>
      <AffiliateTabs programContent={merchantSection} commissionsContent={promoterSection} />
    </div>
  )
}
