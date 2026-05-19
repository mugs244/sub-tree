import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { UsernameForm } from "@/components/UsernameForm"

async function waitForUserRecord(clerkUserId: string) {
  const MAX_ATTEMPTS = 10
  const DELAY_MS = 300
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId },
      select: { username: true, profile: { select: { id: true } } },
    })
    if (user !== null) return user
    if (i < MAX_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, DELAY_MS))
  }
  return null
}

export default async function UsernameOnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await waitForUserRecord(userId)

  if (user?.username) {
    if (!user.profile) redirect("/onboarding/profile")
    redirect("/dashboard")
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 md:py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Pick your username
          </h1>
          <p className="text-[15px] leading-relaxed text-[color:var(--text-secondary)]">
            This is your permanent Sub-tree handle. Choose carefully — it will be your
            public URL.
          </p>
        </div>

        <div className="bg-[color:var(--bg-raised)] border border-[color:var(--border-default)] rounded-xl p-6">
          <UsernameForm />
        </div>
      </div>
    </main>
  )
}
