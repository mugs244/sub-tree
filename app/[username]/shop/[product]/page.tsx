import { notFound } from "next/navigation"
import { getPublicProduct } from "@/lib/services/shop"
import { validateAffiliateRef as validateRef } from "@/lib/services/affiliate"
import { ShopCheckoutForm } from "@/components/ShopCheckoutForm"

type Props = { params: Promise<{ username: string; product: string }>; searchParams: Promise<{ ref?: string }> }

function formatUGX(n: bigint) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(Number(n))
}

export async function generateMetadata({ params }: Props) {
  const { product: raw } = await params
  const id = parseInt(raw, 10)
  if (isNaN(id)) return {}
  const p = await getPublicProduct(id)
  if (!p) return {}
  return { title: `${p.name} — Buy from @${p.user?.username}` }
}

export default async function ProductDetailPage({ params, searchParams }: Props) {
  const { username, product: raw } = await params
  const { ref } = await searchParams
  const productId = parseInt(raw, 10)
  if (isNaN(productId)) notFound()

  const p = await getPublicProduct(productId)
  if (!p || p.user?.username !== username || p.user?.deleted_at) notFound()

  // Validate ref param — if valid, client sets attribution cookie via ShopCheckoutForm
  let affiliateUserId: number | null = null
  if (ref) {
    affiliateUserId = await validateRef(productId, ref)
  }

  const displayName = p.user?.profile?.display_name ?? username
  const isDigital = p.product_type === "DIGITAL"

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-sm space-y-5">
        {/* Product detail */}
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          {p.cover_image_url && (
            <img src={p.cover_image_url} alt="" className="w-full h-36 object-cover" />
          )}
          <div className="px-4 pt-4 pb-4 space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {displayName}&apos;s shop
            </p>
            <h1 className="text-base font-semibold leading-snug">{p.name}</h1>
            <p className="text-2xl font-bold">{formatUGX(p.price)}</p>
            <p className="text-xs text-muted-foreground">{p.description}</p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              {isDigital ? (
                <span className="text-blue-600 dark:text-blue-400 font-medium">⚡ Instant download after payment</span>
              ) : (
                <span>Physical product · Creator handles delivery</span>
              )}
              {p.stock !== null && p.stock < 10 && (
                <span className="text-amber-600 dark:text-amber-400 font-medium">· Only {p.stock} left</span>
              )}
            </div>
          </div>
        </div>

        {/* Checkout form */}
        <div className="bg-background border border-border rounded-xl p-6">
          <ShopCheckoutForm
            productId={productId}
            productName={p.name}
            affiliateUserId={affiliateUserId}
          />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <a href={`/${username}/shop`} className="hover:underline">← Back to shop</a>
        </p>
      </div>
    </main>
  )
}
