"use client"

import { useEffect } from "react"

export function PageViewTracker({ username }: { username: string }) {
  useEffect(() => {
    fetch(`/api/views/${encodeURIComponent(username)}`, { method: "POST" }).catch(() => {})
  }, [username])

  return null
}
