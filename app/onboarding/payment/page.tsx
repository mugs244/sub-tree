import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { PaymentForm } from "@/components/PaymentForm"

type Tier = "PRO" | "BUSINESS" | "CONTENT_HOUSE"
const VALID_TIERS: Tier[] = ["PRO", "BUSINESS", "CONTENT_HOUSE"]

const TIER_LABELS: Record<Tier, string> = {
  PRO: "Pro",
  BUSINESS: "Business",
  CONTENT_HOUSE: "Content House",
}

export default async function PaymentOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const { tier: rawTier } = await searchParams
  const tier = (rawTier?.toUpperCase() ?? "") as Tier
  if (!VALID_TIERS.includes(tier)) redirect("/onboarding/plan")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      tier: true,
      profile: { select: { id: true } },
    },
  })

  if (!user?.username) redirect("/onboarding/username")
  if (!user.profile) redirect("/onboarding/profile")
  if (user.tier !== "FREE") redirect("/dashboard")

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 md:py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Activate {TIER_LABELS[tier]}
          </h1>
          <p className="text-[15px] leading-relaxed text-[color:var(--text-secondary)]">
            We will send a Mobile Money prompt to your phone.
          </p>
        </div>

        <div className="bg-[color:var(--bg-raised)] border border-[color:var(--border-default)] rounded-xl p-6">
          <PaymentForm tier={tier} />
        </div>

        <p className="text-xs text-center text-[color:var(--text-muted)]">
          <a href="/onboarding/plan" className="underline underline-offset-2">
            Choose a different plan
          </a>
        </p>
      </div>
    </main>
  )
}
