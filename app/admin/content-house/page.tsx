import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"
import { AdminContentHouseTable } from "@/components/AdminContentHouseTable"

export const metadata = { title: "Content House Requests — Admin" }

export default async function AdminContentHousePage() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  const raw = await prisma.contentHouseRequest.findMany({
    orderBy: { created_at: "desc" },
    include: {
      members: {
        select: { name: true, phone: true, email: true, share_rate: true },
      },
    },
  })

  const requests = raw.map((r) => ({
    id: r.id,
    status: r.status,
    company_email: r.company_email,
    social_platforms: r.social_platforms,
    features_requested: r.features_requested,
    notes: r.notes,
    created_at: r.created_at.toISOString(),
    members: r.members.map((m) => ({
      name: m.name,
      phone: m.phone,
      email: m.email,
      share_rate: m.share_rate.toString(),
    })),
  }))

  const pending = requests.filter((r) => r.status === "PENDING").length

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-mono text-[color:var(--text-muted)] mb-1">Admin</p>
          <h1 className="text-2xl font-semibold tracking-tight">Content House Requests</h1>
          <p className="text-sm text-[color:var(--text-secondary)] mt-1">
            {pending} pending · {requests.length} total
          </p>
        </div>
        <AdminContentHouseTable requests={requests} />
      </div>
    </main>
  )
}
