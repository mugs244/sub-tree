import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { EditProfileForm } from "@/components/EditProfileForm"
import { DeleteAccountButton } from "@/components/DeleteAccountButton"
import { GiftMeToggle } from "@/components/GiftMeToggle"
import { UsernameSettingsField } from "@/components/UsernameSettingsField"

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      email: true,
      phone: true,
      tier: true,
      created_at: true,
      momo_number: true,
      profile: { select: { display_name: true, bio: true, avatar_url: true, gift_me_enabled: true } },
    },
  })

  return (
    <div className="px-4 py-5 md:p-8 max-w-2xl space-y-10">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Profile</h2>
        <div className="bg-surface border border-border rounded-xl p-5">
          <EditProfileForm
            initialDisplayName={user?.profile?.display_name ?? ""}
            initialBio={user?.profile?.bio ?? ""}
            initialAvatarUrl={user?.profile?.avatar_url ?? ""}
            initialMomoNumber={user?.momo_number ?? ""}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account</h2>
        <div className="bg-surface border border-border rounded-xl divide-y divide-border">
          {user?.username ? (
            <UsernameSettingsField initialUsername={user.username} />
          ) : (
            <Row label="Username" value="—" mono />
          )}
          <Row label="Email" value={user?.email ?? "—"} />
          <Row label="Auth phone" value={user?.phone ?? "—"} mono />
          <Row label="Donation number" value={user?.momo_number ?? "Not set"} mono />
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
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Gift me</h2>
        <div className="bg-surface border border-border rounded-xl">
          <GiftMeToggle initialEnabled={user?.profile?.gift_me_enabled ?? false} />
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
