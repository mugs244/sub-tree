import { NextResponse } from "next/server"
import { Webhook } from "svix"
import { handleClerkUserCreated, handleClerkUserDeleted, handleClerkUserUpdated } from "@/lib/services/clerk"

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
if (!WEBHOOK_SECRET) {
  throw new Error("CLERK_WEBHOOK_SECRET must be set for Clerk webhook verification")
}

export async function POST(req: Request) {
  const svixId = req.headers.get("svix-id")
  const svixTimestamp = req.headers.get("svix-timestamp")
  const svixSignature = req.headers.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse("Missing svix headers", { status: 400 })
  }

  const body = await req.text()
  const webhook = new Webhook(WEBHOOK_SECRET!)
  let event: any
  try {
    event = webhook.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    })
  } catch {
    return new NextResponse("Invalid Clerk webhook signature", { status: 400 })
  }

  const eventType = event.type as string
  const payload = event.data as any

  try {
    switch (eventType) {
      case "user.created":
        await handleClerkUserCreated(payload)
        break
      case "user.updated":
        await handleClerkUserUpdated(payload)
        break
      case "user.deleted":
        await handleClerkUserDeleted(payload)
        break
      default:
        break
    }
  } catch {
    return new NextResponse("Failed to process Clerk webhook event", { status: 500 })
  }

  return NextResponse.json({ received: true })
}
