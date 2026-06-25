import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { listMyOrders } from "@/lib/services/shop"
import { OrderRow } from "@/components/OrderRow"

const BUSINESS_TIERS = ["BUSINESS", "CONTENT_HOUSE"]

export default async function ShopOrdersPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  })
  if (!user || !BUSINESS_TIERS.includes(user.tier)) redirect("/dashboard")

  const orders = await listMyOrders(userId)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{orders.length} confirmed order{orders.length !== 1 ? "s" : ""}</p>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  )
}
