import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"
import { computePlatformRevenue, getAvailableBalance, listWithdrawals } from "@/lib/services/wallet"
import { WithdrawButton } from "./WithdrawButton"

export const metadata = { title: "Wallet — Admin" }
export const dynamic = "force-dynamic"

export default async function AdminWalletPage() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  const [revenue, balance, withdrawals, recentOrders] = await Promise.all([
    computePlatformRevenue(),
    getAvailableBalance(),
    listWithdrawals(),
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

  return (
    <div className="px-4 py-5 md:p-8 max-w-5xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground mb-1">Admin</p>
          <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platform fee revenue across every source — donations, fundraisers, and shop sales.
          </p>
        </div>
        <WithdrawButton available={balance.available} />
      </div>

      {/* ── Summary ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SummaryCard label="Available to withdraw" value={balance.available} highlight />
        <SummaryCard label="Already withdrawn" value={balance.withdrawn} sublabel={`${withdrawals.length} request${withdrawals.length !== 1 ? "s" : ""}`} muted />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard label="Shop fees" value={revenue.shopFeeRevenue} sublabel={`${revenue.shopOrderCount} orders`} />
        <SummaryCard label="Donation fees (est.)" value={revenue.donationFeeEstimate} sublabel={`${revenue.directDonationCount} donations`} />
        <SummaryCard label="Fundraiser fees (est.)" value={revenue.fundraiserFeeEstimate} sublabel={`${revenue.fundraiserDonationCount} donations`} />
      </div>

      <p className="text-xs text-muted-foreground bg-surface border border-border rounded-lg p-3">
        Shop fees are exact — <code className="font-mono">platform_fee</code> is stored per order.
        Donation and fundraiser fees are <strong>estimated</strong>: individual donations don&apos;t store
        their own fee amount, so each donation is priced against whatever <code className="font-mono">fee_donation_free</code> /{" "}
        <code className="font-mono">fee_fundraiser_free</code>{" "}
        rate was actually in effect on its date, reconstructed from the settings audit log — not just today&apos;s current rate.
        Withdraw only moves platform fee revenue, never donor or creator principal.
      </p>

      {/* ── Volume context ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SummaryCard label="Total donation volume" value={revenue.totalDonationVolume} muted />
        <SummaryCard label="Total shop volume" value={revenue.shopVolume} muted />
      </div>

      {/* ── Withdrawal history ────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Withdrawal history</h2>
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Requested by</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No withdrawals yet.
                  </td>
                </tr>
              )}
              {withdrawals.map((w) => (
                <tr key={w.id} className="bg-background hover:bg-surface transition-colors duration-100">
                  <td className="px-4 py-3 font-mono">UGX {Number(w.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <WithdrawalStatusBadge status={w.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{w.admin.username ?? w.admin.email}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {w.created_at.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function WithdrawalStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-warning-bg text-warning",
    COMPLETED: "bg-success-bg text-success",
    FAILED: "bg-error-bg text-error",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-surface text-muted-foreground"}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
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
