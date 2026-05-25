"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  handle: string
  initialIsFollowing: boolean
  initialCount: number
  isLoggedIn: boolean
}

export function FollowButton({ handle, initialIsFollowing, initialCount, isLoggedIn }: Props) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialIsFollowing)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!isLoggedIn) {
      router.push(`/fan/join/${handle}`)
      return
    }

    setLoading(true)
    const method = following ? "DELETE" : "POST"
    const res = await fetch(`/api/fan/follow/${handle}`, { method })
    if (res.ok) {
      setFollowing(!following)
      setCount((c) => c + (following ? -1 : 1))
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={toggle}
        disabled={loading}
        className={[
          "px-5 py-1.5 rounded-full text-xs font-semibold border transition-colors disabled:opacity-50",
          following
            ? "bg-transparent border-border text-muted-foreground hover:border-destructive hover:text-destructive"
            : "bg-foreground text-background border-foreground hover:opacity-80",
        ].join(" ")}
      >
        {loading ? "…" : following ? "Following" : "Follow"}
      </button>
      {count > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {count.toLocaleString()} {count === 1 ? "follower" : "followers"}
        </p>
      )}
    </div>
  )
}
