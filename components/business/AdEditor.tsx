"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Smartphone, Tablet, Monitor, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type AdFormat = "BANNER" | "VIDEO" | "SLIDE_UP_POPUP"
type BookingStatus = "DRAFT" | "READY" | "PUBLISHED" | "COMPLETED" | "CANCELLED" | "REFUNDED"
type Viewport = "phone" | "tablet" | "computer"

interface CreativeState {
  format: AdFormat
  mediaUrl: string | null
  logoUrl: string | null
  appUrl: string | null
  websiteUrl: string | null
  productName: string | null
  productDesc: string | null
}

const FORMAT_LABELS: Record<AdFormat, string> = {
  BANNER: "Banner",
  VIDEO: "Video",
  SLIDE_UP_POPUP: "Slide-up pop-up",
}

const VIEWPORT_WIDTH: Record<Viewport, string> = {
  phone: "max-w-[320px]",
  tablet: "max-w-[480px]",
  computer: "max-w-[720px]",
}

export function AdEditor({
  bookingId,
  startsAt,
  endsAt,
  status,
  companyName,
  creative,
}: {
  bookingId: number
  startsAt: string
  endsAt: string
  status: BookingStatus
  companyName: string
  creative: CreativeState | null
}) {
  const router = useRouter()
  const [format, setFormat] = useState<AdFormat>(creative?.format ?? "BANNER")
  const [mediaUrl, setMediaUrl] = useState(creative?.mediaUrl ?? "")
  const [logoUrl, setLogoUrl] = useState(creative?.logoUrl ?? "")
  const [appUrl, setAppUrl] = useState(creative?.appUrl ?? "")
  const [websiteUrl, setWebsiteUrl] = useState(creative?.websiteUrl ?? "")
  const [productName, setProductName] = useState(creative?.productName ?? "")
  const [productDesc, setProductDesc] = useState(creative?.productDesc ?? "")
  const [viewport, setViewport] = useState<Viewport>("phone")
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState(status)
  const [hasSavedCreative, setHasSavedCreative] = useState(creative !== null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/business/ad-slots/${bookingId}/creative`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, mediaUrl, logoUrl, appUrl, websiteUrl, productName, productDesc }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? "Could not save this ad")
        return
      }
      setHasSavedCreative(true)
      if (currentStatus === "DRAFT") setCurrentStatus("READY")
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setSaving(false)
    }
  }

  async function publish() {
    setPublishing(true)
    setError(null)
    try {
      const res = await fetch(`/api/business/ad-slots/${bookingId}/publish`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? "Could not publish this ad")
        return
      }
      setCurrentStatus("PUBLISHED")
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setPublishing(false)
    }
  }

  async function cancelBooking() {
    setCancelling(true)
    setError(null)
    try {
      const res = await fetch(`/api/business/ad-slots/${bookingId}/cancel`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? "Could not cancel this booking")
        return
      }
      router.push("/business/ad-slots")
    } catch {
      setError("Network error — please try again")
    } finally {
      setCancelling(false)
    }
  }

  // Only pre-publish bookings can be self-cancelled for a refund — mirrors
  // the same rule enforced server-side in cancelAdSlot.
  const canCancel = currentStatus === "DRAFT" || currentStatus === "READY"

  return (
    <div className="px-4 py-5 md:p-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ad editor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date(startsAt).toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" })} to{" "}
          {new Date(endsAt).toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Form ─────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="format">Ad format</Label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value as AdFormat)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {(Object.keys(FORMAT_LABELS) as AdFormat[]).map((f) => (
                <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="logo-url">Logo URL</Label>
            <Input id="logo-url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://" />
          </div>

          {format !== "BANNER" && (
            <div className="space-y-1.5">
              <Label htmlFor="media-url">{format === "VIDEO" ? "Video URL" : "Banner image URL"}</Label>
              <Input id="media-url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://" />
            </div>
          )}
          {format === "BANNER" && (
            <div className="space-y-1.5">
              <Label htmlFor="media-url-banner">Banner image URL</Label>
              <Input id="media-url-banner" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="app-url">App URL</Label>
            <Input id="app-url" value={appUrl} onChange={(e) => setAppUrl(e.target.value)} placeholder="https://" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website-url">Website address</Label>
            <Input id="website-url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-name">Product name</Label>
            <Input id="product-name" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Product or service name" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-desc">Product details</Label>
            <Textarea
              id="product-desc"
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              rows={3}
              placeholder="Shown on the slide-up banner"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-2">
            {canCancel && (
              <Button
                variant="ghost"
                onClick={() => void cancelBooking()}
                disabled={cancelling}
                className="text-destructive hover:text-destructive sm:mr-auto"
              >
                {cancelling ? "Cancelling…" : "Cancel booking"}
              </Button>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => void save()} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button onClick={() => void publish()} disabled={publishing || !hasSavedCreative || currentStatus === "PUBLISHED"}>
                {currentStatus === "PUBLISHED" ? "Live" : publishing ? "Publishing…" : "Publish"}
              </Button>
            </div>
          </div>
          {canCancel && (
            <p className="text-[11px] text-muted-foreground">
              Cancelling refunds the slot and any booked reruns to your wallet.
            </p>
          )}
        </div>

        {/* ── Preview ──────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex gap-1 bg-surface border border-border p-1 rounded-lg w-fit">
            {([
              { id: "phone", icon: Smartphone },
              { id: "tablet", icon: Tablet },
              { id: "computer", icon: Monitor },
            ] as { id: Viewport; icon: React.ElementType }[]).map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setViewport(id)}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors",
                  viewport === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {id}
              </button>
            ))}
          </div>

          <div className="border border-border rounded-xl bg-surface p-6 flex justify-center">
            <div className={["w-full border border-border rounded-lg bg-background overflow-hidden", VIEWPORT_WIDTH[viewport]].join(" ")}>
              <div className="aspect-[9/16] bg-background relative flex items-center justify-center text-muted-foreground text-xs">
                Content feed
                {format === "BANNER" && mediaUrl && (
                  <img src={mediaUrl} alt="Banner preview" className="absolute inset-x-0 bottom-0 h-16 object-cover" />
                )}
                {format === "VIDEO" && (
                  <span className="absolute bottom-2 left-2 text-[10px] font-medium bg-black/70 text-white px-1.5 py-0.5 rounded">
                    Advertisement
                  </span>
                )}
                {format === "SLIDE_UP_POPUP" && (productName || logoUrl) && (
                  <div className="absolute inset-x-0 bottom-0 bg-background border-t border-border p-2.5 flex items-center gap-2">
                    {logoUrl && <img src={logoUrl} alt="" className="h-8 w-8 rounded-md object-cover shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{productName || companyName}</p>
                      {productDesc && <p className="text-[10px] text-muted-foreground truncate">{productDesc}</p>}
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
