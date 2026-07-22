import { NextResponse } from "next/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { getSession } from "@/lib/auth/session"

// Client-upload authorizer for advertiser media — the company logo (during
// onboarding, before the Advertiser exists) and ad creatives (banner images,
// video ads) in the editor. Requires only a logged-in user, not an advertiser
// membership, so it also covers the onboarding logo step. The browser uploads
// straight to Blob; this route just mints the scoped token.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "UPLOAD_NOT_CONFIGURED", message: "Media upload isn't set up yet — try again later" },
      { status: 503 },
    )
  }

  const body = (await req.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "video/mp4",
          "video/quicktime",
        ],
        maximumSizeInBytes: 100 * 1024 * 1024, // 100 MB — accommodates video ads; images are far smaller
        addRandomSuffix: true,
      }),
    })
    return NextResponse.json(jsonResponse)
  } catch (err) {
    return NextResponse.json(
      { error: "UPLOAD_FAILED", message: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 },
    )
  }
}
