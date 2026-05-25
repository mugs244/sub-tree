"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, Lock, Link2 } from "lucide-react"

type FeedPost = {
  id: number
  content: string | null
  visibility: string
  is_pinned: boolean
  like_count: number
  published_at: Date | string
  liked: boolean
  locked: boolean
  user: {
    id: number
    username: string | null
    profile: { display_name: string; avatar_url: string | null } | null
  }
  links: { id: number; url: string }[]
}

interface Props {
  initialPosts: FeedPost[]
}

export function FanFeedClient({ initialPosts }: Props) {
  const [likedIds, setLikedIds] = useState<Set<number>>(
    new Set(initialPosts.filter((p) => p.liked).map((p) => p.id))
  )
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>(
    Object.fromEntries(initialPosts.map((p) => [p.id, p.like_count]))
  )

  async function toggleLike(postId: number) {
    const liked = likedIds.has(postId)
    const res = await fetch(`/api/posts/${postId}/like`, { method: liked ? "DELETE" : "POST" })
    if (res.ok) {
      setLikedIds((prev) => {
        const next = new Set(prev)
        liked ? next.delete(postId) : next.add(postId)
        return next
      })
      setLikeCounts((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + (liked ? -1 : 1) }))
    }
  }

  if (initialPosts.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm text-muted-foreground">Your feed is empty.</p>
        <p className="text-xs text-muted-foreground">
          Follow creators on their profile pages to see their posts here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {initialPosts.map((post) => {
        const name = post.user.profile?.display_name ?? post.user.username ?? "Unknown"
        const avatar = post.user.profile?.avatar_url
        const liked = likedIds.has(post.id)

        return (
          <article key={post.id} className="bg-background border border-border rounded-xl overflow-hidden">
            {/* Creator header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              {avatar ? (
                <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-muted-foreground">{name[0]?.toUpperCase()}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/${post.user.username}`}
                  className="text-sm font-medium hover:underline truncate block"
                >
                  {name}
                </Link>
                <p className="text-[11px] text-muted-foreground">
                  @{post.user.username} · {new Date(post.published_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Post body */}
            <div className="px-4 py-3 space-y-2">
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
                      {post.visibility === "SUPPORTERS_ONLY" ? (
                        <>
                          <Link href={`/${post.user.username}/donate`} className="text-primary hover:underline">
                            Support {name}
                          </Link>{" "}
                          to unlock this post
                        </>
                      ) : (
                        "Subscribe to unlock this post"
                      )}
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
            </div>

            {/* Like footer */}
            <div className="px-4 py-2 border-t border-border">
              <button
                onClick={() => void toggleLike(post.id)}
                className={[
                  "flex items-center gap-1.5 text-xs transition-colors",
                  liked ? "text-red-500" : "text-muted-foreground hover:text-red-500",
                ].join(" ")}
              >
                <Heart className={["h-4 w-4", liked ? "fill-current" : ""].join(" ")} />
                {likeCounts[post.id] ?? 0}
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
