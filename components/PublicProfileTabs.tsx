"use client"

import { useState } from "react"
import { Heart, Lock, Link2 } from "lucide-react"

type PostLink = { id: number; url: string; smart_card_meta: unknown }

type PublicPost = {
  id: number
  content: string | null
  visibility: string
  is_pinned: boolean
  like_count: number
  published_at: Date | string
  links: PostLink[]
  liked: boolean
  locked: boolean
}

interface Props {
  linksContent: React.ReactNode
  posts: PublicPost[]
  isLoggedIn: boolean
}

export function PublicProfileTabs({ linksContent, posts, isLoggedIn }: Props) {
  const [tab, setTab] = useState<"links" | "posts">("links")
  const [likedIds, setLikedIds] = useState<Set<number>>(
    new Set(posts.filter((p) => p.liked).map((p) => p.id))
  )
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>(
    Object.fromEntries(posts.map((p) => [p.id, p.like_count]))
  )

  async function toggleLike(postId: number) {
    if (!isLoggedIn) return
    const liked = likedIds.has(postId)
    const method = liked ? "DELETE" : "POST"
    const res = await fetch(`/api/posts/${postId}/like`, { method })
    if (res.ok) {
      setLikedIds((prev) => {
        const next = new Set(prev)
        liked ? next.delete(postId) : next.add(postId)
        return next
      })
      setLikeCounts((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? 0) + (liked ? -1 : 1),
      }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("links")}
          className={[
            "px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
            tab === "links" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          Links
        </button>
        <button
          onClick={() => setTab("posts")}
          className={[
            "px-4 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
            tab === "posts" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          Posts
          {posts.length > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {posts.length}
            </span>
          )}
        </button>
      </div>

      {tab === "links" ? (
        linksContent
      ) : (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No posts yet.</p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-background border border-border rounded-xl p-4 space-y-2"
              >
                {post.is_pinned && (
                  <p className="text-[10px] font-medium text-primary">📌 Pinned</p>
                )}

                {post.locked ? (
                  <div className="space-y-2">
                    {post.content && (
                      <p className="text-sm text-muted-foreground blur-[3px] select-none leading-relaxed">
                        {post.content}
                      </p>
                    )}
                    <div className="flex items-center gap-2 py-2 px-3 bg-muted rounded-lg">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {post.visibility === "SUPPORTERS_ONLY"
                          ? "Support this creator to unlock"
                          : "Subscribe to unlock"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {post.content && (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                    )}
                    {post.links[0] && (
                      <a
                        href={post.links[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-primary underline underline-offset-2 truncate"
                      >
                        <Link2 className="h-3.5 w-3.5 shrink-0" />
                        {post.links[0].url}
                      </a>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => void toggleLike(post.id)}
                    className={[
                      "flex items-center gap-1 text-xs transition-colors",
                      likedIds.has(post.id)
                        ? "text-red-500"
                        : isLoggedIn
                          ? "text-muted-foreground hover:text-red-500"
                          : "text-muted-foreground cursor-default",
                    ].join(" ")}
                  >
                    <Heart className={["h-4 w-4", likedIds.has(post.id) ? "fill-current" : ""].join(" ")} />
                    {likeCounts[post.id] ?? 0}
                  </button>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(post.published_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
