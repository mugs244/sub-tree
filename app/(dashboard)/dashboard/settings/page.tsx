import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { EditProfileForm } from "@/components/EditProfileForm"
import { DeleteAccountButton } from "@/components/DeleteAccountButton"

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: {
      username: true,
      email: true,
      phone: true,
      tier: true,
      created_at: true,
      profile: { select: { display_name: true, bio: true, avatar_url: true } },
    },
  })
    select: {
      username: true,
      email: true,
      phone: true,
      tier: true,
      created_at: true,
      profile: { select: { display_name: true, bio: true, avatar_url: true } },
    },
  })

  return (
    <div className="p-6 md:p-8 max-w-2xl space-y-10">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Profile</h2>
        <div className="bg-surface border border-border rounded-xl p-5">
          <EditProfileForm
            initialDisplayName={user?.profile?.display_name ?? ""}
            initialBio={user?.profile?.bio ?? ""}
            initialAvatarUrl={user?.profile?.avatar_url ?? ""}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account</h2>
        <div className="bg-surface border border-border rounded-xl divide-y divide-border">
          <Row label="Username" value={`@${user?.username ?? "—"}`} mono />
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
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Danger zone</h2>
        <div className="bg-surface border border-destructive/30 rounded-xl p-5 space-y-3">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently removes your profile and all links. Donation records are retained for legal purposes.
            </p>
          </div>
          <DeleteAccountButton />
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
