import { notFound } from "next/navigation"
import Link from "next/link"
import { getPublicShop } from "@/lib/services/shop"
import { prisma } from "@/lib/db"

type Props = { params: Promise<{ username: string }> }

function formatUGX(n: bigint) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(Number(n))
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username },
    select: { profile: { select: { display_name: true } } },
  })
  if (!user) return {}
  return { title: `${user.profile?.display_name ?? username}'s Shop` }
}

export default async function PublicShopPage({ params }: Props) {
  const { username } = await params
  const products = await getPublicShop(username)
  if (!products) notFound()

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-sm space-y-5">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Shop</p>
          <h1 className="text-base font-semibold mt-0.5">@{username}</h1>
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No products available.</p>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/${username}/shop/${p.id}`}
                className="block bg-background border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors"
              >
                {p.cover_image_url && (
                  <img src={p.cover_image_url} alt="" className="w-full h-28 object-cover" />
                )}
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.product_type === "DIGITAL" ? "Digital" : "Physical"}
                      {p.stock !== null && ` · ${p.stock} left`}
                    </p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">{formatUGX(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link href={`/${username}`} className="hover:underline">← Back to profile</Link>
        </p>
      </div>
    </main>
  )
}
