import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { Plus, ShoppingBag } from "lucide-react"
import { ProductCard } from "@/components/ProductCard"
import { getEscrowSummary } from "@/lib/services/shop"

const BUSINESS_TIERS = ["BUSINESS", "CONTENT_HOUSE"]

function formatUGX(n: bigint) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(Number(n))
}

export default async function ShopPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true, tier: true },
  })
  if (!user || !BUSINESS_TIERS.includes(user.tier)) redirect("/dashboard")

  const [products, escrow] = await Promise.all([
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
  ])

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

      {/* Escrow summary */}
      {escrow.held_count > 0 && (
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Escrow summary</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-base font-semibold">{formatUGX(escrow.held_amount)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Held</p>
            </div>
            <div>
              <p className="text-base font-semibold">{escrow.held_count}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Orders held</p>
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
          <div className="mt-3 flex gap-2 justify-center">
            <Link href="/dashboard/shop/orders" className="text-xs text-primary hover:underline">View orders →</Link>
          </div>
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
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
