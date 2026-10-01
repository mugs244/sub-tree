"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EditProfileForm } from "@/components/EditProfileForm"
import { RowLabel } from "@/components/settings/RowLabel"

// Centred profile header for Settings: photo, name, email and an Edit
// profile button that opens the profile form underneath.
export function ProfileHeader({
  displayName,
  email,
  avatarUrl,
  bio,
}: {
  displayName: string
  email: string | null
  avatarUrl: string | null
  bio: string
}) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="flex flex-col items-center text-center">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-card" />
      ) : (
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#ff8a3d] text-4xl font-bold text-[#111827] ring-4 ring-card">
          {displayName.charAt(0).toUpperCase()}
        </span>
      )}
      <h1 className="mt-3 text-2xl font-bold tracking-tight">{displayName}</h1>
      {email && <p className="text-sm text-muted-foreground">{email}</p>}
      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        aria-expanded={editing}
        className="mt-4 rounded-full border-2 border-[#ff8a3d] px-5 py-2 text-sm font-semibold text-[color:var(--dash-orange-text)] transition-colors duration-150 hover:bg-[color:var(--dash-orange-soft)]"
      >
        {editing ? "Close" : "Edit profile"}
      </button>
      {editing && (
        <div className="mt-5 w-full rounded-3xl bg-surface p-5 text-left">
          <EditProfileForm initialDisplayName={displayName} initialBio={bio} initialAvatarUrl={avatarUrl ?? ""} />
        </div>
      )}
    </div>
  )
}

export function SignOutRow() {
  const router = useRouter()
  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/sign-in")
  }
  return (
    <button type="button" onClick={() => void signOut()} className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-black/[0.02]">
      <RowLabel icon="logout" label="Sign out" />
    </button>
  )
}
