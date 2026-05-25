import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { listCreatorPosts } from "@/lib/services/posts"
import { PostsClient } from "@/components/PostsClient"

export const metadata = { title: "Posts" }

export default async function PostsDashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const posts = await listCreatorPosts(userId)
  return <PostsClient initialPosts={posts} />
}
