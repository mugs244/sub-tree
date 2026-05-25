"use client"

import { useState } from "react"
import Link from "next/link"

type FollowEntry = {
  id: number
  followed_at: Date | string
  creator: {
    username: string | null
    profile: { display_name: string; avatar_url: string | null; bio: string | null } | null
    _count: { followers: number }
  }
}

interface Props {
  initialFollowing: FollowEntry[]
}

export function FanFollowingClient({ initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [unfollowing, setUnfollowing] = useState<string | null>(null)

  async function handleUnfollow(handle: string) {
    setUnfollowing(handle)
    const res = await fetch(`/api/fan/follow/${handle}`, { method: "DELETE" })
    if (res.ok) {
      setFollowing((prev) => prev.filter((f) => f.creator.username !== handle))
    }
    setUnfollowing(null)
  }

  if (following.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <p className="text-sm text-muted-foreground">You're not following anyone yet.</p>
        <p className="text-xs text-muted-foreground">
          Visit a creator's profile and tap Follow to see their posts in your feed.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {following.map((entry) => {
        const handle = entry.creator.username
        const name = entry.creator.profile?.display_name ?? handle ?? "Unknown"
        const avatar = entry.creator.profile?.avatar_url
        const followerCount = entry.creator._count.followers

        return (
          <div key={entry.id} className="flex items-center gap-3 bg-background border border-border rounded-xl p-3">
            <Link href={`/${handle}`} className="shrink-0">
              {avatar ? (
                <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium text-muted-foreground">{name[0]?.toUpperCase()}</span>
                </div>
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <Link href={`/${handle}`} className="text-sm font-medium hover:underline truncate block">
                {name}
              </Link>
              <p className="text-xs text-muted-foreground font-mono">@{handle}</p>
              {followerCount > 0 && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {followerCount.toLocaleString()} follower{followerCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            <button
              onClick={() => handle && void handleUnfollow(handle)}
              disabled={unfollowing === handle}
              className="shrink-0 px-3 py-1.5 text-xs font-medium border border-border rounded-full text-muted-foreground hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50"
            >
              {unfollowing === handle ? "…" : "Unfollow"}
            </button>
          </div>
        )
      })}
    </div>
  )
}
