import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"
import { getRateHistory, rateAtTime } from "@/lib/services/platform-settings"

export const metadata = { title: "Wallet — Admin" }

async function estimateFeeRevenue(
  donations: { amount: number; created_at: Date }[],
  rateKey: string,
) {
  if (donations.length === 0) return 0
  const periods = await getRateHistory(rateKey, 0.05)
  return donations.reduce((sum, d) => sum + d.amount * rateAtTime(periods, d.created_at), 0)
}

export default async function AdminWalletPage() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  const [shopAgg, completedDonations, recentOrders] = await Promise.all([
    prisma.order.aggregate({
      where: { payment_confirmed: true },
      _sum: { platform_fee: true, amount_paid: true },
      _count: { id: true },
    }),
    prisma.donation.findMany({
      where: { status: "COMPLETED" },
      select: { amount: true, created_at: true, fundraiser_id: true },
    }),
    prisma.order.findMany({
      where: { payment_confirmed: true },
      orderBy: { created_at: "desc" },
      take: 20,
      select: {
        id: true,
        amount_paid: true,
        platform_fee: true,
        seller_amount: true,
        created_at: true,
        seller: { select: { username: true, email: true } },
      },
    }),
  ])

  const directDonations = completedDonations.filter((d) => d.fundraiser_id === null)
  const fundraiserDonations = completedDonations.filter((d) => d.fundraiser_id !== null)

  const [donationFeeEstimate, fundraiserFeeEstimate] = await Promise.all([
    estimateFeeRevenue(directDonations, "fee_donation_free"),
    estimateFeeRevenue(fundraiserDonations, "fee_fundraiser_free"),
  ])

  const shopFeeRevenue = Number(shopAgg._sum.platform_fee ?? BigInt(0))
  const shopVolume = Number(shopAgg._sum.amount_paid ?? BigInt(0))
  const totalDonationVolume = completedDonations.reduce((sum, d) => sum + d.amount, 0)
  const totalPlatformRevenue = shopFeeRevenue + donationFeeEstimate + fundraiserFeeEstimate

  return (
    <div className="px-4 py-5 md:p-8 max-w-5xl space-y-8">
      <div>
        <p className="text-xs font-mono text-muted-foreground mb-1">Admin</p>
        <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform fee revenue across every source — donations, fundraisers, and shop sales.
        </p>
      </div>

      {/* ── Summary ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total platform revenue" value={totalPlatformRevenue} highlight />
        <SummaryCard label="Shop fees" value={shopFeeRevenue} sublabel={`${shopAgg._count.id} orders`} />
        <SummaryCard label="Donation fees (est.)" value={donationFeeEstimate} sublabel={`${directDonations.length} donations`} />
        <SummaryCard label="Fundraiser fees (est.)" value={fundraiserFeeEstimate} sublabel={`${fundraiserDonations.length} donations`} />
      </div>

      <p className="text-xs text-muted-foreground bg-surface border border-border rounded-lg p-3">
        Shop fees are exact — <code className="font-mono">platform_fee</code> is stored per order.
        Donation and fundraiser fees are <strong>estimated</strong>: individual donations don&apos;t store
        their own fee amount, so each donation is priced against whatever <code className="font-mono">fee_donation_free</code> /{" "}
        <code className="font-mono">fee_fundraiser_free</code>{" "}
        rate was actually in effect on its date,
        reconstructed from the settings audit log — not just today&apos;s current rate.
      </p>

      {/* ── Volume context ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SummaryCard label="Total donation volume" value={totalDonationVolume} muted />
        <SummaryCard label="Total shop volume" value={shopVolume} muted />
      </div>

      {/* ── Recent shop orders ─────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Recent shop orders</h2>
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Seller</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Paid</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Platform fee</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Seller amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No confirmed orders yet.
                  </td>
                </tr>
              )}
              {recentOrders.map((o) => (
                <tr key={o.id} className="bg-background hover:bg-surface transition-colors duration-100">
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.seller.username ?? o.seller.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono">UGX {Number(o.amount_paid).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">UGX {Number(o.platform_fee).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">UGX {Number(o.seller_amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {o.created_at.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  sublabel,
  highlight,
  muted,
}: {
  label: string
  value: number
  sublabel?: string
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <div
      className={[
        "rounded-xl border p-4 space-y-1",
        highlight ? "bg-foreground text-background border-foreground" : "bg-surface border-border",
      ].join(" ")}
    >
      <p className={["text-xs", highlight ? "text-background/70" : "text-muted-foreground"].join(" ")}>{label}</p>
      <p className={["text-xl font-semibold tracking-tight", muted ? "text-muted-foreground" : ""].join(" ")}>
        UGX {Math.round(value).toLocaleString()}
      </p>
      {sublabel && (
        <p className={["text-[11px]", highlight ? "text-background/60" : "text-muted-foreground"].join(" ")}>
          {sublabel}
        </p>
      )}
    </div>
  )
}
