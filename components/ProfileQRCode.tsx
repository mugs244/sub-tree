"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProfileQRCodeProps {
  url: string
}

// Generated at a much higher resolution than it's displayed — the preview
// thumbnail is small to stay compact on mobile, but the downloaded file
// needs to hold up printed on a poster or overlaid on a stream.
const DOWNLOAD_SIZE = 512

export function ProfileQRCode({ url }: ProfileQRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(url, {
      width: DOWNLOAD_SIZE,
      margin: 1,
      color: { dark: "#111827", light: "#ffffff" },
    })
      .then((result) => { if (!cancelled) setDataUrl(result) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [url])

  function download() {
    if (!dataUrl) return
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = "sub-tree-qr-code.png"
    a.click()
  }

  return (
    <div className="flex items-center gap-3">
      <div className="h-16 w-16 shrink-0 rounded-lg border border-border bg-white overflow-hidden flex items-center justify-center">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="QR code to your public page" className="h-full w-full object-contain" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={download} disabled={!dataUrl}>
        <Download className="h-4 w-4 mr-2" />
        Download QR code
      </Button>
    </div>
  )
}
