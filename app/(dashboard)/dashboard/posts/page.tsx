import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { listCreatorPosts } from "@/lib/services/posts"
import { PostsClient } from "@/components/PostsClient"

export const metadata = { title: "Posts" }

export default async function PostsDashboardPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const posts = await listCreatorPosts(userId)
  return <PostsClient initialPosts={posts} />
}
