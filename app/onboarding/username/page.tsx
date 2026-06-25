import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { UsernameForm } from "@/components/UsernameForm"

export default async function UsernameOnboardingPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const cookieStore = await cookies()
  const isFan = !!cookieStore.get("fan_redirect")?.value

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, profile: { select: { id: true } } },
  })

  if (user?.username) {
    if (isFan) redirect("/onboarding/fan")
    if (!user.profile) redirect("/onboarding/profile")
    redirect("/dashboard")
  }

  const subtitle = isFan
    ? "Pick a handle for your fan profile. This is your permanent Sub-tree username."
    : "This is your permanent Sub-tree handle. Choose carefully — it will be your public URL."

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 md:py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Pick your username
          </h1>
          <p className="text-[15px] leading-relaxed text-[color:var(--text-secondary)]">
            {subtitle}
          </p>
        </div>

        <div className="bg-[color:var(--bg-raised)] border border-[color:var(--border-default)] rounded-xl p-6">
          <UsernameForm nextPath={isFan ? "/onboarding/fan" : "/onboarding/profile"} />
        </div>
      </div>
    </main>
  )
}
