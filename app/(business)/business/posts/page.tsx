import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { listPosts } from "@/lib/services/advertiser-posts"
import { PostsManager } from "@/components/business/PostsManager"

export default async function BusinessPostsPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) redirect("/dashboard")

  const posts = await listPosts(advertiser.id)

  return (
    <PostsManager
      initialPosts={posts.map((p) => ({
        id: p.id,
        content: p.content,
        createdAt: p.createdAt.toISOString(),
        authorName: p.authorName,
        commentCount: p.commentCount,
      }))}
    />
  )
}
