"use client"

import { useRef, useState } from "react"
import { upload } from "@vercel/blob/client"
import { Pencil, Loader2 } from "lucide-react"
import { DefaultAvatar } from "@/components/DefaultAvatar"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 5 * 1024 * 1024

interface AvatarUploadProps {
  value: string
  onChange: (url: string) => void
}

// WhatsApp/Instagram-style profile picture: a big round photo (grey
// silhouette when empty) with a pen badge on the bottom-right edge. Tapping
// the photo, the pen or the caption all open the photo picker.
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
      const blob = await upload(`avatars/${crypto.randomUUID()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload/avatar",
      })
      onChange(blob.url)
    } catch (err) {
      // Show Blob's own reason (e.g. a private store or missing token) so a
      // setup problem is visible instead of a generic failure.
      const reason = err instanceof Error ? err.message.replace(/^Vercel Blob:s*/i, "") : ""
      console.error("Avatar upload failed", err)
      setError(reason ? `Upload failed: ${reason}` : "Upload failed — please try again")
    } finally {
      setUploading(false)
    }
  }

  const pick = () => inputRef.current?.click()

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-28 w-28">
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          aria-label={value ? "Change profile photo" : "Add profile photo"}
          className={[
            "h-28 w-28 rounded-full overflow-hidden flex items-end justify-center transition-opacity hover:opacity-90 disabled:opacity-60",
            value ? "bg-muted" : "bg-[#DFE5E7] dark:bg-white/15",
          ].join(" ")}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Profile photo" className="h-full w-full object-cover" />
          ) : (
            <DefaultAvatar />
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 right-1 h-9 w-9 rounded-full bg-[#111827] text-white border-[3px] border-background dark:bg-white dark:text-[#111827] shadow flex items-center justify-center"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" strokeWidth={2.25} />}
        </span>
      </div>
      <button
        type="button"
        onClick={pick}
        disabled={uploading}
        className="text-sm font-semibold text-foreground underline-offset-4 hover:underline disabled:opacity-60"
      >
        {uploading ? "Uploading…" : value ? "Edit photo" : "Add profile photo"}
      </button>
      {!value && !error && <p className="text-xs text-muted-foreground">JPG, PNG or WEBP, up to 5MB</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

