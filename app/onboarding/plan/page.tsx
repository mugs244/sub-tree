import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { PlanPicker } from "@/components/PlanPicker"

export default async function PlanOnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: {
      username: true,
      tier: true,
      profile: { select: { id: true } },
    },
  })

  if (!user?.username) redirect("/onboarding/username")
  if (!user.profile) redirect("/onboarding/profile")

  // Already on a paid plan — skip directly to dashboard
  if (user.tier !== "FREE") redirect("/dashboard")

  const cookieStore = await cookies()
  const pendingPlan = cookieStore.get("pending_plan")?.value ?? null

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 md:py-16">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Choose your plan
          </h1>
          <p className="text-[15px] leading-relaxed text-[color:var(--text-secondary)]">
            Start free and upgrade whenever you are ready.
          </p>
        </div>

        <PlanPicker preselected={pendingPlan} />
      </div>
    </main>
  )
}
