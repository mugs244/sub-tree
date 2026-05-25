import { notFound } from "next/navigation"
import Link from "next/link"
import { getPublicShop } from "@/lib/services/shop"
import { prisma } from "@/lib/db"
import { ShopCategoryFilter } from "@/components/ShopCategoryFilter"

type Props = { params: Promise<{ username: string }> }

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
          <ShopCategoryFilter products={products} username={username} />
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link href={`/${username}`} className="hover:underline">← Back to profile</Link>
        </p>
      </div>
    </main>
  )
}
