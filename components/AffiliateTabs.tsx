"use client"

import { useState } from "react"

interface Props {
  programContent: React.ReactNode
  commissionsContent: React.ReactNode
}

export function AffiliateTabs({ programContent, commissionsContent }: Props) {
  const [tab, setTab] = useState<"program" | "commissions">("program")

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {(["program", "commissions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
              tab === t
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t === "program" ? "My Program" : "My Commissions"}
          </button>
        ))}
      </div>

      {tab === "program" ? programContent : commissionsContent}
    </div>
  )
}
