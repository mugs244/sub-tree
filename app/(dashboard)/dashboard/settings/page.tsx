import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { prisma } from "@/lib/db"
import { DeleteAccountButton } from "@/components/DeleteAccountButton"
import { GiftMeToggle } from "@/components/GiftMeToggle"
import { UsernameSettingsField } from "@/components/UsernameSettingsField"
import { ChangePasswordForm } from "@/components/ChangePasswordForm"
import { NumberChangeField } from "@/components/NumberChangeField"
import { BankDetailsField } from "@/components/BankDetailsField"
import { EmailChangeField } from "@/components/EmailChangeField"
import { ThemeToggle } from "@/components/dashboard/ThemeToggle"
import { RowLabel, type SettingsIcon } from "@/components/settings/RowLabel"
import { ProfileHeader, SignOutRow } from "@/components/settings/SettingsClientParts"

// Settings, laid out like a phone app's profile screen: who you are on top,
// then grouped cards of icon rows with the current value on the right.
export default async function SettingsPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      email: true,
      password_hash: true,
      phone: true,
      created_at: true,
      momo_number: true,
      bank_name: true,
      bank_account_name: true,
      bank_account_number: true,
      profile: { select: { display_name: true, bio: true, avatar_url: true, gift_me_enabled: true } },
    },
  })

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 pb-6 pt-4 md:px-8 md:py-10">
      <ProfileHeader
        displayName={user?.profile?.display_name ?? user?.username ?? "You"}
        email={user?.email ?? null}
        avatarUrl={user?.profile?.avatar_url ?? null}
        bio={user?.profile?.bio ?? ""}
      />

      {/* Linked from the withdraw flow (#payouts). Withdrawals only ever go
          to these saved, verified details. */}
      <Group id="payouts" title="Payouts" note="Donations go to your mobile money number. Withdrawals can go to either.">
        <NumberChangeField
          icon="smartphone"
          label="Mobile money"
          initialValue={user?.momo_number ?? null}
          requestUrl="/api/account/momo-number/request-change"
          confirmUrl="/api/account/momo-number/confirm-change"
          fieldName="new_momo_number"
        />
        <BankDetailsField
          icon="bank"
          initial={user?.bank_name && user.bank_account_name && user.bank_account_number
            ? { bankName: user.bank_name, accountName: user.bank_account_name, maskedNumber: `•••• ${user.bank_account_number.slice(-4)}` }
            : null}
        />
      </Group>

      <Group title="Account">
        {user?.username && <UsernameSettingsField icon="username" initialUsername={user.username} />}
        <ChangePasswordForm icon="password" />
        <EmailChangeField icon="email" initialEmail={user?.email ?? ""} hasPassword={Boolean(user?.password_hash)} />
        <NumberChangeField
          icon="phone"
          label="Phone"
          initialValue={user?.phone ?? null}
          requestUrl="/api/account/phone/request-change"
          confirmUrl="/api/account/phone/confirm-change"
          fieldName="new_phone"
        />
        <ValueRow
          icon="calendar"
          label="Member since"
          value={user?.created_at ? new Date(user.created_at).toLocaleDateString("en-UG", { month: "long", year: "numeric" }) : "—"}
        />
      </Group>

      <Group title="Preferences">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <RowLabel icon="theme" label="Theme" />
          <div className="w-full sm:w-[230px]">
            <ThemeToggle />
          </div>
        </div>
        <GiftMeToggle icon="gift" initialEnabled={user?.profile?.gift_me_enabled ?? false} />
      </Group>

      <Group title="Support">
        <Link href="/dashboard/support" className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-black/[0.02]">
          <RowLabel icon="support" label="Contact support" />
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            Usually within a day
            <ChevronRight className="h-4 w-4" />
          </span>
        </Link>
      </Group>

      <Group>
        <SignOutRow />
        <div className="space-y-3 px-4 py-3.5">
          <RowLabel icon="trash" label="Delete account" />
          <p className="text-xs text-muted-foreground">
            Permanently removes your profile and all links. Donation records are kept for legal purposes.
          </p>
          <DeleteAccountButton />
        </div>
      </Group>
    </div>
  )
}

function Group({ id, title, note, children }: { id?: string; title?: string; note?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="rounded-3xl bg-surface py-2">
        {title && <h2 className="px-4 pb-1 pt-3 text-lg font-semibold tracking-tight">{title}</h2>}
        {children}
      </div>
      {note && <p className="mt-2 px-4 text-xs text-muted-foreground">{note}</p>}
    </section>
  )
}

function ValueRow({ icon, label, value }: { icon: SettingsIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <RowLabel icon={icon} label={label} />
      <span className="min-w-0 truncate text-sm text-muted-foreground">{value}</span>
    </div>
  )
}
