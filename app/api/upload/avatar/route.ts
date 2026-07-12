import { NextResponse } from "next/server"
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client"
import { issueSignedToken } from "@vercel/blob"
import { getSession } from "@/lib/auth/session"

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 5 * 1024 * 1024

// Store connected via Vercel's OIDC-based Blob integration (BLOB_STORE_ID +
// BLOB_WEBHOOK_PUBLIC_KEY, no static BLOB_READ_WRITE_TOKEN) — so this uses
// the presigned-token flow (issueSignedToken / handleUploadPresigned), which
// is the one that supports OIDC auth. The classic handleUpload/upload pair
// only accepts a static read-write token and would fail here.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  if (!process.env.BLOB_STORE_ID) {
    return NextResponse.json(
      { error: "UPLOAD_NOT_CONFIGURED", message: "Photo upload isn't set up yet — try again later" },
      { status: 503 },
    )
  }

  const body = (await req.json()) as HandleUploadPresignedBody

  try {
    const jsonResponse = await handleUploadPresigned({
      body,
      request: req,
      getSignedToken: async (pathname) => {
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          validUntil: Date.now() + 5 * 60 * 1000,
        })
        return {
          token,
          urlOptions: {
            allowedContentTypes: ALLOWED_CONTENT_TYPES,
            maximumSizeInBytes: MAX_BYTES,
            addRandomSuffix: true,
          },
        }
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (err) {
    return NextResponse.json(
      { error: "UPLOAD_FAILED", message: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 },
    )
  }
}
