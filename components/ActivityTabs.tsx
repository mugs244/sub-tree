"use client"

import { useState } from "react"
import { NotificationsFeed } from "@/components/NotificationsFeed"
import { DonationsTable, type DonationRow } from "@/components/DonationsTable"
import { DonationExportButton } from "@/components/DonationExportButton"

type Tab = "donations" | "notifications"

export function ActivityTabs({ donations }: { donations: DonationRow[] }) {
  const [tab, setTab] = useState<Tab>("donations")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border p-1 bg-surface">
          <TabButton active={tab === "donations"} onClick={() => setTab("donations")}>
            Donations
          </TabButton>
          <TabButton active={tab === "notifications"} onClick={() => setTab("notifications")}>
            Notifications
          </TabButton>
        </div>
        {tab === "donations" && donations.length > 0 && <DonationExportButton />}
      </div>

      {tab === "donations" ? (
        <DonationsTable donations={donations} />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Updates every 30 seconds</p>
          <NotificationsFeed />
        </div>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  )
}
