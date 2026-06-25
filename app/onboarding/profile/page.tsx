import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { ProfileForm } from "@/components/ProfileForm"

export default async function ProfileOnboardingPage() {
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
  if (user.profile) redirect("/onboarding/links")

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 md:py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Set up your profile
          </h1>
          <p className="text-[15px] leading-relaxed text-[color:var(--text-secondary)]">
            This is what visitors will see on your Sub-tree page.
          </p>
        </div>

        <div className="bg-[color:var(--bg-raised)] border border-[color:var(--border-default)] rounded-xl p-6">
          <ProfileForm />
        </div>
      </div>
    </main>
  )
}
