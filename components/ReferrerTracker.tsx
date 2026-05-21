"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { detectPlatform } from "@/lib/utils/platform"

export function ReferrerTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const refParam = searchParams.get("ref")
    let source: string | null = null

    if (refParam) {
      source = refParam.slice(0, 50)
    } else if (document.referrer) {
      const platform = detectPlatform(document.referrer)
      if (platform !== "website") source = platform
    }

    if (source) {
      sessionStorage.setItem("st_referrer", source)
    }
  }, [searchParams])

  return null
}
