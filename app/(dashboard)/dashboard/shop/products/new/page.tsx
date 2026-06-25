import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { ProductForm } from "@/components/ProductForm"

const BUSINESS_TIERS = ["BUSINESS", "CONTENT_HOUSE"]

export default async function NewProductPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  })
  if (!user || !BUSINESS_TIERS.includes(user.tier)) redirect("/dashboard")

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">New product</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Add a digital or physical product to your shop.</p>
      </div>
      <div className="bg-background border border-border rounded-xl p-6">
        <ProductForm mode="create" />
      </div>
    </div>
  )
}
