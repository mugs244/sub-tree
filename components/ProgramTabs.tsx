"use client"

import { useState } from "react"

interface Props {
  affiliateContent: React.ReactNode
  campaignContent: React.ReactNode
  campaignCount: number
}

export function ProgramTabs({ affiliateContent, campaignContent, campaignCount }: Props) {
  const [tab, setTab] = useState<"affiliates" | "campaigns">("affiliates")

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("affiliates")}
          className={[
            "px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
            tab === "affiliates"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          Affiliate Requests
        </button>
        <button
          onClick={() => setTab("campaigns")}
          className={[
            "px-4 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
            tab === "campaigns"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          Campaign Requests
          {campaignCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {campaignCount}
            </span>
          )}
        </button>
      </div>

      {tab === "affiliates" ? affiliateContent : campaignContent}
    </div>
  )
}
