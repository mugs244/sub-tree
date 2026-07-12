"use client"

import { useRef, useState } from "react"
import { uploadPresigned } from "@vercel/blob/client"
import { Camera, Loader2, User as UserIcon } from "lucide-react"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 5 * 1024 * 1024

interface AvatarUploadProps {
  value: string
  onChange: (url: string) => void
}

// Big centered circle with a camera badge overlapping the bottom-right edge —
// the Facebook/Instagram profile-photo pattern, not a side-by-side row.
export function AvatarUpload({ value, onChange }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG, or WEBP image")
      return
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 5MB")
      return
    }

    setUploading(true)
    try {
      const blob = await uploadPresigned(`avatars/${crypto.randomUUID()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload/avatar",
      })
      onChange(blob.url)
    } catch {
      setError("Upload failed — please try again")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <div className="h-24 w-24 rounded-full border border-border bg-muted overflow-hidden flex items-center justify-center">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Profile photo" className="h-full w-full object-cover" />
          ) : (
            <UserIcon className="h-9 w-9 text-muted-foreground" />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
        <button
          type="button"
          aria-label="Upload photo"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground border-2 border-background shadow flex items-center justify-center disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
