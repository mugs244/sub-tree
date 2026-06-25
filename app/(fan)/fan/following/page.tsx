import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { getFanFollowing } from "@/lib/services/fan"
import { FanFollowingClient } from "@/components/FanFollowingClient"

export const metadata = { title: "Following" }

export default async function FanFollowingPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const following = await getFanFollowing(userId)

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Following</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {following.length} creator{following.length !== 1 ? "s" : ""} you follow
        </p>
      </div>
      <FanFollowingClient initialFollowing={following} />
    </div>
  )
}
