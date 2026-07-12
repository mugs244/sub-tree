"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { UsernameForm } from "@/components/UsernameForm"

export function UsernameSettingsField({ initialUsername }: { initialUsername: string }) {
  const [username, setUsername] = useState(initialUsername)
  const [editing, setEditing] = useState(false)

  if (!editing) {
    return (
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-muted-foreground">Username</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-sm font-medium font-mono hover:underline"
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
