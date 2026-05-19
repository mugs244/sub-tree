import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { UsernameForm } from "@/components/UsernameForm"

export default async function UsernameOnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: { username: true },
  })

  if (user?.username) redirect("/dashboard")

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
