import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { listNotifications } from "@/lib/services/notification"
import { BusinessNotifications } from "@/components/business/BusinessNotifications"

export default async function BusinessNotificationsPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) redirect("/dashboard")

  const notifications = await listNotifications(session.userId)

  return (
    <BusinessNotifications
      initialNotifications={notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        readAt: n.read_at?.toISOString() ?? null,
        createdAt: n.created_at.toISOString(),
      }))}
    />
  )
}
