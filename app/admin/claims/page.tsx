import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { isAdmin, listClaims } from "@/lib/services/admin"
import { AdminClaimsTable } from "@/components/AdminClaimsTable"

export const metadata = { title: "Username Claims — Admin" }

export default async function AdminClaimsPage() {
  const { userId } = await auth()
  if (!userId || !isAdmin(userId)) redirect("/")

  const raw = await listClaims("PENDING")
  const claims = raw.map((c) => ({ ...c, created_at: c.created_at.toISOString() }))

  return (
    <main className="min-h-screen bg-surface px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-mono text-muted-foreground mb-1">Admin</p>
          <h1 className="text-2xl font-semibold tracking-tight">Username Claims</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {claims.length} pending request{claims.length !== 1 ? "s" : ""}
          </p>
        </div>
        <AdminClaimsTable initialClaims={claims} />
      </div>
    </main>
  )
}
