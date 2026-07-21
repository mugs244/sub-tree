import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { listTeam } from "@/lib/services/advertiser-team"
import { TeamManager } from "@/components/business/TeamManager"

export default async function BusinessTeamPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) redirect("/dashboard")

  const members = await listTeam(advertiser.id)

  return (
    <TeamManager
      viewerRole={advertiser.role}
      viewerUserId={session.userId}
      initialMembers={members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joined_at?.toISOString() ?? null,
        userId: m.user.id,
        email: m.user.email,
        username: m.user.username,
      }))}
    />
  )
}
