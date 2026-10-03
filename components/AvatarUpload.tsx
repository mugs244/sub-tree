"use client"

import { useRef, useState } from "react"
import { upload } from "@vercel/blob/client"
import { Pencil, Loader2 } from "lucide-react"
import { DefaultAvatar } from "@/components/DefaultAvatar"

// Phone library photos are often 5–20MB and sometimes HEIC, so every photo
// is shrunk on the device to a 1024px JPEG before upload (a few hundred KB).
const MAX_INPUT_BYTES = 40 * 1024 * 1024
const MAX_SIDE = 1024

async function toJpeg(file: File): Promise<Blob> {
  let source: CanvasImageSource
  let width: number
  let height: number
  try {
    // Respects the photo's rotation (EXIF), so portraits aren't sideways.
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" })
    source = bmp
    width = bmp.width
    height = bmp.height
  } catch {
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      source = img
      width = img.naturalWidth
      height = img.naturalHeight
    } finally {
      URL.revokeObjectURL(url)
    }
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Couldn't process that photo")
  ctx.fillStyle = "#ffffff" // transparent PNGs get a white background
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process that photo"))), "image/jpeg", 0.85),
  )
}

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

    if (file.type && !file.type.startsWith("image/")) {
      setError("Please choose a photo")
      return
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError("That photo is too large — please choose a smaller one")
      return
    }

    setUploading(true)
    let jpeg: Blob
    try {
      jpeg = await toJpeg(file)
    } catch {
      setUploading(false)
      setError("That photo format isn't supported here — try a JPG or PNG, or take a screenshot of it")
      return
    }
    try {
      const blob = await upload(`avatars/${crypto.randomUUID()}.jpg`, jpeg, {
        access: "public",
        contentType: "image/jpeg",
        handleUploadUrl: "/api/upload/avatar",
      })
      onChange(blob.url)
    } catch (err) {
      // Show Blob's own reason (e.g. a private store or missing token) so a
      // setup problem is visible instead of a generic failure.
      const reason = err instanceof Error ? err.message.replace(/^Vercel Blob:\s*/i, "") : ""
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
          accept="image/*"
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
      {!value && !error && <p className="text-xs text-muted-foreground">Any photo from your library or camera</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

