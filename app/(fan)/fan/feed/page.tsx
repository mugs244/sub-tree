import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getFanFeed } from "@/lib/services/fan"
import { FanFeedClient } from "@/components/FanFeedClient"

export const metadata = { title: "Your Feed" }

export default async function FanFeedPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const posts = await getFanFeed(userId)

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Feed</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Latest from creators you follow</p>
      </div>
      <FanFeedClient initialPosts={posts} />
    </div>
  )
}
