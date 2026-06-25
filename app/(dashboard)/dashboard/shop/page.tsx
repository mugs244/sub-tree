import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { Plus, ShoppingBag, TrendingUp, Clock, CheckCircle2 } from "lucide-react"
import { ProductCard } from "@/components/ProductCard"
import { getEscrowSummary } from "@/lib/services/shop"
import { ShopLinkCopy } from "@/components/ShopLinkCopy"

const BUSINESS_TIERS = ["BUSINESS", "CONTENT_HOUSE"]

function formatUGX(n: bigint | number) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(Number(n))
}

export default async function ShopPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tier: true, username: true },
  })
  if (!user || !BUSINESS_TIERS.includes(user.tier)) redirect("/dashboard")

  const [products, escrow, orderStats] = await Promise.all([
    prisma.product.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
      select: {
        id: true, name: true, price: true, product_type: true,
        status: true, stock: true, affiliate_open: true,
        _count: { select: { orders: { where: { payment_confirmed: true } } } },
      },
    }),
    getEscrowSummary(userId),
    prisma.order.aggregate({
      where: { seller_user_id: user.id, payment_confirmed: true },
      _sum: { seller_amount: true },
      _count: { id: true },
    }),
  ])

  const pendingCount = await prisma.order.count({
    where: { seller_user_id: user.id, payment_confirmed: true, escrow_status: "HELD" },
  })
  const completedCount = await prisma.order.count({
    where: { seller_user_id: user.id, escrow_status: "RELEASED" },
  })

  const totalRevenue = orderStats._sum.seller_amount ?? BigInt(0)
  const totalSold = orderStats._count.id

  // Top 3 products by confirmed order count
  const mostSold = [...products]
    .sort((a, b) => b._count.orders - a._count.orders)
    .filter((p) => p._count.orders > 0)
    .slice(0, 3)

  const shopUrl = user.username ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sub-tree.com"}/${user.username}/shop` : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Shop</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your products and orders</p>
        </div>
        <Link
          href="/dashboard/shop/products/new"
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Revenue</p>
          <p className="text-base font-semibold mt-1">{formatUGX(totalRevenue)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">released</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Items sold</p>
          <p className="text-base font-semibold mt-1">{totalSold}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">all time</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </p>
          <p className="text-base font-semibold mt-1">{pendingCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            <Link href="/dashboard/shop/orders" className="hover:underline">View orders →</Link>
          </p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </p>
          <p className="text-base font-semibold mt-1">{completedCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">released</p>
        </div>
      </div>

      {/* Shop link */}
      {shopUrl && <ShopLinkCopy url={shopUrl} />}

      {/* Most sold */}
      {mostSold.length > 0 && (
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Top products
          </p>
          <div className="space-y-2">
            {mostSold.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                  <span className="text-sm truncate">{p.name}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">{p._count.orders} sold</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escrow summary */}
      {escrow.held_count > 0 && (
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Escrow held</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-base font-semibold">{formatUGX(escrow.held_amount)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Amount</p>
            </div>
            <div>
              <p className="text-base font-semibold">{escrow.held_count}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Orders</p>
            </div>
            <div>
              <p className={["text-base font-semibold", escrow.disputed_count > 0 ? "text-destructive" : ""].join(" ")}>
                {escrow.disputed_count}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Disputed</p>
            </div>
          </div>
          {escrow.next_release_at && (
            <p className="text-[11px] text-muted-foreground mt-3 text-center">
              Next release: {new Date(escrow.next_release_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Products */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground mb-3" strokeWidth={1} />
          <p className="text-sm font-medium">No products yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first digital or physical product to start selling.</p>
          <Link
            href="/dashboard/shop/products/new"
            className="mt-4 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Add product
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">All products</p>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
