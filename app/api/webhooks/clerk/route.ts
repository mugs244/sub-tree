import { NextResponse } from "next/server"
import { Webhook } from "svix"
import { handleClerkUserCreated, handleClerkUserDeleted, handleClerkUserUpdated } from "@/lib/services/clerk"

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
if (!WEBHOOK_SECRET) {
  throw new Error("CLERK_WEBHOOK_SECRET must be set for Clerk webhook verification")
}

export async function POST(req: Request) {
  const webhook = new Webhook(WEBHOOK_SECRET)
  const signature = req.headers.get("Clerk-Signature") ?? req.headers.get("clerk-signature")
  if (!signature) {
    return new NextResponse("Missing Clerk signature header", { status: 400 })
  }

  const headers: Record<string, string> = {
    "webhook-signature": signature,
    "webhook-timestamp":
      req.headers.get("Clerk-Timestamp") ??
      req.headers.get("clerk-timestamp") ??
      req.headers.get("svix-timestamp") ??
      req.headers.get("webhook-timestamp") ?? "",
    "webhook-id":
      req.headers.get("Clerk-Id") ??
      req.headers.get("clerk-id") ??
      req.headers.get("svix-id") ??
      req.headers.get("webhook-id") ?? "",
  }

  const body = await req.text()
  let event: any
  try {
    event = webhook.verify(body, headers)
  } catch (error) {
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
  } catch (error) {
    return new NextResponse("Failed to process Clerk webhook event", { status: 500 })
  }

  return NextResponse.json({ received: true })
}
