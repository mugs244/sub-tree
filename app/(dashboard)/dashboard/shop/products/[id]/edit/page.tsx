import { getSession } from "@/lib/auth/session"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { ProductForm } from "@/components/ProductForm"

type Props = { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const { id: raw } = await params
  const productId = parseInt(raw, 10)
  if (isNaN(productId)) notFound()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!user) redirect("/sign-in")

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true, user_id: true, name: true, description: true, price: true,
      product_type: true, cover_image_url: true, file_url: true,
      shipping_info: true, stock: true, auto_release_days: true,
      affiliate_rate: true, affiliate_open: true, status: true,
    },
  })
  if (!product || product.user_id !== user.id) notFound()

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Edit product</h1>
        <p className="text-sm text-muted-foreground mt-0.5 truncate">{product.name}</p>
      </div>
      <div className="bg-background border border-border rounded-xl p-6">
        <ProductForm
          mode="edit"
          productId={product.id}
          defaults={{
            name: product.name,
            description: product.description,
            price: Number(product.price),
            product_type: product.product_type,
            cover_image_url: product.cover_image_url,
            file_url: product.file_url,
            shipping_info: product.shipping_info,
            stock: product.stock,
            auto_release_days: product.auto_release_days,
            affiliate_rate: Number(product.affiliate_rate),
            affiliate_open: product.affiliate_open,
            status: product.status !== "SOLD_OUT" ? product.status : undefined,
          }}
        />
      </div>
    </div>
  )
}
