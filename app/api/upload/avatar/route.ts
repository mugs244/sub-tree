import { NextResponse } from "next/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { getSession } from "@/lib/auth/session"

// Uses the "sub-tree-avatars" Blob store (access: public — set at creation,
// can't be changed after). A blob's access mode is a store-level property,
// not a per-upload option — the original store was created Private and had
// to be replaced, since avatar photos need to load with no auth.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "UPLOAD_NOT_CONFIGURED", message: "Photo upload isn't set up yet — try again later" },
      { status: 503 },
    )
  }

  const body = (await req.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
        maximumSizeInBytes: 5 * 1024 * 1024,
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
