import { prisma } from "@/lib/db"
import { DonationStatusClient } from "./DonationStatusClient"

export const dynamic = "force-dynamic"
export const metadata = { title: "Payment status — Sub-tree" }

type Props = { searchParams: Promise<{ ref?: string }> }

export default async function DonateCompletePage({ searchParams }: Props) {
  const { ref } = await searchParams

  const donation = ref
    ? await prisma.donation.findUnique({
        where: { idempotency_key: ref },
        select: {
          status: true,
          amount: true,
          user: { select: { username: true, profile: { select: { display_name: true } } } },
        },
      })
    : null

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-background border border-border rounded-xl p-8 space-y-4">
        {!donation ? (
          <p className="text-center text-sm text-muted-foreground">We couldn&apos;t find that payment.</p>
        ) : (
          <>
            <DonationStatusClient donationRef={ref!} initialStatus={donation.status} />
            <p className="text-center text-xs text-muted-foreground">
              UGX {donation.amount.toLocaleString()} to {donation.user.profile?.display_name ?? donation.user.username}
            </p>
          </>
        )}
        {donation?.user.username && (
          <p className="text-center text-xs pt-2">
            <a href={`/${donation.user.username}`} className="text-muted-foreground hover:underline">
              ← Back to profile
            </a>
          </p>
        )}
      </div>
    </main>
  )
}
