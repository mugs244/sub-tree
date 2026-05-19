import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { UserButton } from "@clerk/nextjs"

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: {
      username: true,
      email: true,
      phone: true,
      tier: true,
      created_at: true,
    },
  })
  if (!user) {
    redirect("/sign-in")
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account</h2>
        <div className="bg-surface border border-border rounded-xl divide-y divide-border">
          <Row label="Username" value={`@${user?.username}`} mono />
          <Row label="Email" value={user?.email ?? "—"} />
          <Row label="Phone" value={user?.phone ?? "—"} mono />
          <Row label="Plan" value={user?.tier === "PRO" ? "Pro" : "Free"} />
          <Row
            label="Member since"
            value={user?.created_at
              ? new Date(user.created_at).toLocaleDateString("en-UG", { month: "long", year: "numeric" })
              : "—"}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Clerk account</h2>
        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
          <UserButton />
          <p className="text-sm text-muted-foreground">
            Manage your password, connected accounts, and security via Clerk.
          </p>
        </div>
      </section>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  )
}
