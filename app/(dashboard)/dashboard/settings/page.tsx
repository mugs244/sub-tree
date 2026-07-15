import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import Link from "next/link"
import { MessageCircle, ChevronRight } from "lucide-react"
import { prisma } from "@/lib/db"
import { EditProfileForm } from "@/components/EditProfileForm"
import { DeleteAccountButton } from "@/components/DeleteAccountButton"
import { GiftMeToggle } from "@/components/GiftMeToggle"
import { UsernameSettingsField } from "@/components/UsernameSettingsField"
import { ChangePasswordForm } from "@/components/ChangePasswordForm"
import { NumberChangeField } from "@/components/NumberChangeField"

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
    <div className="px-4 py-5 md:p-8 max-w-2xl space-y-6 md:space-y-10">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Profile</h2>
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
          <EditProfileForm
            initialDisplayName={user?.profile?.display_name ?? ""}
            initialBio={user?.profile?.bio ?? ""}
            initialAvatarUrl={user?.profile?.avatar_url ?? ""}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account</h2>
        <div className="bg-surface border border-border rounded-xl divide-y divide-border">
          {user?.username ? (
            <UsernameSettingsField initialUsername={user.username} />
          ) : (
            <Row label="Username" value="—" mono />
          )}
          <ChangePasswordForm />
          <Row label="Email" value={user?.email ?? "—"} />
          <NumberChangeField
            label="Auth phone"
            initialValue={user?.phone ?? null}
            requestUrl="/api/account/phone/request-change"
            confirmUrl="/api/account/phone/confirm-change"
            fieldName="new_phone"
          />
          <NumberChangeField
            label="Donation number"
            initialValue={user?.momo_number ?? null}
            requestUrl="/api/account/momo-number/request-change"
            confirmUrl="/api/account/momo-number/confirm-change"
            fieldName="new_momo_number"
          />
          <Row label="Plan" value={user?.tier === "PRO" ? "Pro" : "Free"} />
          <Row
            label="Member since"
            value={user?.created_at
              ? new Date(user.created_at).toLocaleDateString("en-UG", { month: "long", year: "numeric" })
              : "—"}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Gift me</h2>
        <div className="bg-surface border border-border rounded-xl">
          <GiftMeToggle initialEnabled={user?.profile?.gift_me_enabled ?? false} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Support</h2>
        <Link
          href="/dashboard/support"
          className="flex items-center justify-between gap-3 bg-surface border border-border rounded-xl px-4 py-3.5 hover:bg-border/20 transition-colors duration-150"
        >
          <div className="flex items-center gap-3">
            <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium">Message support</p>
              <p className="text-xs text-muted-foreground mt-0.5">We usually reply within a day.</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Danger zone</h2>
        <div className="bg-surface border border-destructive/30 rounded-xl p-4 sm:p-5 space-y-3">
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
