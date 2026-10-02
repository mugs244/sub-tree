import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { EMAIL_GROUPS } from "@/lib/services/email-tester"
import { EmailTester } from "./EmailTester"

export const metadata = { title: "Emails — Admin" }

export default async function AdminEmailsPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true } })

  return (
    <div className="max-w-3xl space-y-6 px-4 py-5 md:p-8">
      <div>
        <p className="mb-1 font-mono text-xs text-muted-foreground">Admin</p>
        <h1 className="text-2xl font-semibold tracking-tight">Emails</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send a real copy of any Sub-tree email to <strong className="text-foreground">{me?.email}</strong>, through
          the same code creators get, with sample data. Subjects start with [Test] and no SMS is sent.
        </p>
      </div>
      <EmailTester groups={EMAIL_GROUPS.map((g) => ({ group: g.group, emails: g.emails.map(({ key, label }) => ({ key, label })) }))} />
    </div>
  )
}
