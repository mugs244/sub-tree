import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { ActivityTabs } from "@/components/ActivityTabs"

export const metadata = { title: "Activity" }

export default async function ActivityPage() {
  const session = await getSession()
  const userId = session!.userId

  const donations = await prisma.donation.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: 50,
    select: {
      id: true,
      donor_name: true,
      donor_phone: true,
      amount: true,
      currency: true,
      status: true,
      provider: true,
      created_at: true,
    },
  })

  return (
    <div className="px-4 py-5 md:p-8 max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
      <ActivityTabs donations={donations} />
    </div>
  )
}
