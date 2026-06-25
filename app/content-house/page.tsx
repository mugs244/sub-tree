import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { ContentHouseForm } from "@/components/ContentHouseForm"

export const metadata = { title: "Content House — Sub-tree" }

export default async function ContentHousePage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  return (
    <main className="min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Content House
          </h1>
          <p className="text-[15px] leading-relaxed text-[color:var(--text-secondary)] max-w-prose">
            Built for multi-creator studios. Share one link page across your whole
            team, split donations by share rate, and manage everything from a shared
            dashboard. Fill in the form below — you&apos;ll get immediate access to the
            portal as a trial while we review your application.
          </p>
        </div>

        <div className="bg-[color:var(--bg-raised)] border border-[color:var(--border-default)] rounded-xl p-6 md:p-8">
          <ContentHouseForm />
        </div>

        <p className="text-xs text-[color:var(--text-muted)]">
          UGX 80,000/mo · 5-day free trial · Billed monthly via Mobile Money
        </p>
      </div>
    </main>
  )
}
