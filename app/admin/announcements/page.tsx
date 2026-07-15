import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { AdminAnnouncementComposer } from "@/components/AdminAnnouncementComposer"

export const metadata = { title: "Announcements — Admin" }

export default async function AdminAnnouncementsPage() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  return (
    <div className="px-4 py-5 md:p-8 max-w-2xl space-y-4">
      <div>
        <p className="text-xs font-mono text-muted-foreground mb-1">Admin</p>
        <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send a notification to all users, or just one.
        </p>
      </div>
      <AdminAnnouncementComposer />
    </div>
  )
}
