import { NextResponse } from "next/server"
import { verifySmileWebhook } from "@/lib/services/smile-id"
import { handleSmileResult } from "@/lib/services/verification"

// Smile ID posts each verdict here. The signature only covers a timestamp,
// so handleSmileResult also ignores anything that isn't an attempt we
// started and haven't decided yet.
export async function POST(req: Request): Promise<NextResponse> {
  const ok = verifySmileWebhook(req.headers.get("Response-Timestamp"), req.headers.get("Response-Signature"))
  if (!ok) return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 })

  let payload: Record<string, unknown>
  try { payload = (await req.json()) as Record<string, unknown> } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 })
  }

  const params = (payload.partner_params ?? payload.PartnerParams ?? {}) as Record<string, unknown>
  const smileUserId = String(params.user_id ?? "")
  const status = String(payload.status ?? "")
  if (!smileUserId || !status) return NextResponse.json({ received: true })

  // Keep only what admins need — never ID numbers or dates of birth.
  const text = (k: string) => (typeof payload[k] === "string" ? (payload[k] as string) : null)
  const summary = [text("ResultCode"), text("ResultText"), text("result_text"), text("reason")].filter(Boolean).join(" · ") || null
  const idFullName = text("FullName") ?? text("full_name")

  // Short-lived image links (Enhanced Document Verification webhooks). Only
  // used if this turns out to be an "attention" case needing admin review.
  const links = (payload.image_links ?? payload.ImageLinks ?? null) as Record<string, unknown> | null
  const link = (k: string) => (links && typeof links[k] === "string" ? (links[k] as string) : undefined)
  const imageLinks = links
    ? { id_front: link("id_card_image"), id_back: link("id_card_back_image") ?? link("id_card_back"), selfie: link("selfie_image") }
    : undefined

  try {
    await handleSmileResult({ smileUserId, jobId: params.job_id ? String(params.job_id) : null, status, summary, idFullName, imageLinks })
  } catch (err) {
    console.error("Smile ID webhook processing failed", err)
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 })
  }
  return NextResponse.json({ received: true })
}
