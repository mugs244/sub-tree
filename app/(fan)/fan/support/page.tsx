import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getFanSupportHistory } from "@/lib/services/fan"

export const metadata = { title: "Support History" }

function formatUGX(amount: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function FanSupportPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const history = await getFanSupportHistory(userId)

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Support History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your completed donations
        </p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-sm text-muted-foreground">No donations yet.</p>
          <p className="text-xs text-muted-foreground">
            Support a creator to see your history here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((d) => {
            const name = d.user.profile?.display_name ?? d.user.username ?? "Unknown"
            const avatar = d.user.profile?.avatar_url
            return (
              <div key={d.id} className="flex items-center gap-3 bg-background border border-border rounded-xl p-3">
                <Link href={`/${d.user.username}`} className="shrink-0">
                  {avatar ? (
                    <img src={avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">{name[0]?.toUpperCase()}</span>
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link href={`/${d.user.username}`} className="text-sm font-medium hover:underline truncate block">
                    {name}
                  </Link>
                  {d.note && <p className="text-xs text-muted-foreground truncate">{d.note}</p>}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(d.created_at).toLocaleDateString()}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-semibold">{formatUGX(d.amount)}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
