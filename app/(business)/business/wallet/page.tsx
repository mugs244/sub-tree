import { redirect } from "next/navigation"
import { Wallet } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { listAdvertiserWalletTransactions } from "@/lib/services/advertiser-wallet"
import { WalletTopUp } from "@/components/business/WalletTopUp"

const TX_LABEL: Record<string, string> = {
  TOPUP: "Wallet top-up",
  SLOT_PURCHASE: "Ad slot booked",
  RERUN_PURCHASE: "Rerun booked",
  REFUND: "Refund",
  CREDIT_PURCHASE: "Credits purchased",
}

export default async function BusinessWalletPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) redirect("/dashboard")

  const transactions = await listAdvertiserWalletTransactions(advertiser.id)

  return (
    <div className="px-4 py-5 md:p-8 max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>

      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background border border-border">
            <Wallet className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Available balance</p>
            <p className="text-3xl font-semibold tracking-tight">
              UGX {Number(advertiser.wallet_balance_ugx).toLocaleString()}
            </p>
          </div>
        </div>
        <WalletTopUp />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium">Recent activity</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 text-center border border-border rounded-xl">
            No wallet activity yet
          </p>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3 bg-background text-sm">
                <div>
                  <span className="font-medium">{TX_LABEL[tx.type] ?? tx.type}</span>
                  {tx.note && <p className="text-[11px] text-muted-foreground">{tx.note}</p>}
                </div>
                <div className="text-right">
                  <span className={["font-mono", tx.amount_ugx < 0 ? "text-destructive" : "text-success"].join(" ")}>
                    {tx.amount_ugx > 0 ? "+" : ""}
                    UGX {tx.amount_ugx.toLocaleString()}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {tx.created_at.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
