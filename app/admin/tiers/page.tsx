import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"

export default async function AdminTiersPage() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  const tiers = await prisma.membershipTier.findMany({
    orderBy: { created_at: "desc" },
    include: { creator: { select: { username: true, email: true } } },
  })

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-mono text-[color:var(--text-muted)] mb-1">Admin</p>
          <h1 className="text-2xl font-semibold tracking-tight">Membership Tiers</h1>
          <p className="text-sm text-[color:var(--text-secondary)] mt-1">
            {tiers.length} tiers
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[color:var(--border-default)]">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[color:var(--border-default)] bg-[color:var(--bg-raised)]">
                <th className="text-left px-4 py-3 font-medium text-[color:var(--text-secondary)]">Creator</th>
                <th className="text-left px-4 py-3 font-medium text-[color:var(--text-secondary)]">Title</th>
                <th className="text-left px-4 py-3 font-medium text-[color:var(--text-secondary)]">Price</th>
                <th className="text-left px-4 py-3 font-medium text-[color:var(--text-secondary)]">Created</th>
                <th className="text-left px-4 py-3 font-medium text-[color:var(--text-secondary)]">Updated</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr
                  key={tier.id}
                  className="border-b border-[color:var(--border-default)] last:border-0 hover:bg-[color:var(--bg-raised)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{tier.creator.username ?? tier.creator.email}</p>
                  </td>
                  <td className="px-4 py-3">{tier.name}</td>
                  <td className="px-4 py-3">UGX {Number(tier.price_ugx).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[color:var(--text-secondary)]">{tier.created_at.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3 text-[color:var(--text-secondary)]">{tier.updated_at.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
              {tiers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[color:var(--text-muted)]">
                    No membership tiers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
