import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { SupportInbox } from "./SupportInbox"

export const metadata = { title: "Support — Admin" }
export const dynamic = "force-dynamic"

export default async function AdminSupportPage() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  return (
    <div className="px-4 py-5 md:p-8 max-w-5xl space-y-4">
      <div>
        <p className="text-xs font-mono text-muted-foreground mb-1">Admin</p>
        <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Conversations between creators and the Sub-tree team.
        </p>
      </div>
      <SupportInbox />
    </div>
  )
}
