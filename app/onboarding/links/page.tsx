import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { FirstLinkForm } from "@/components/FirstLinkForm"

export default async function LinksOnboardingPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      profile: { select: { id: true } },
    },
  })

  if (!user?.username) redirect("/onboarding/username")
  if (!user.profile) redirect("/onboarding/profile")

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 md:py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Add your first link
          </h1>
          <p className="text-[15px] leading-relaxed text-[color:var(--text-secondary)]">
            Give visitors somewhere to go. You can add more links from your dashboard.
          </p>
        </div>

        <div className="bg-[color:var(--bg-raised)] border border-[color:var(--border-default)] rounded-xl p-6">
          <FirstLinkForm />
        </div>
      </div>
    </main>
  )
}
