"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { UsernameForm } from "@/components/UsernameForm"
import { RowLabel, type SettingsIcon } from "@/components/settings/RowLabel"

export function UsernameSettingsField({ initialUsername, icon }: { initialUsername: string; icon?: SettingsIcon }) {
  const [username, setUsername] = useState(initialUsername)
  const [editing, setEditing] = useState(false)

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <RowLabel icon={icon} label="Username" />
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          @{username}
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <UsernameForm
        mode="rename"
        initialUsername={username}
        onSaved={(next) => {
          setUsername(next)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    </div>
  )
}
