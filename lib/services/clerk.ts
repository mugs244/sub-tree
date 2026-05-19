import { prisma } from "@/lib/db"

function getSingleEmail(payload: any): string | null {
  if (!payload) return null
  if (typeof payload.email === "string") return payload.email
  if (Array.isArray(payload.email_addresses) && payload.email_addresses.length > 0) {
    return payload.email_addresses[0]?.email_address ?? null
  }
  if (typeof payload.email_address === "string") return payload.email_address
  return null
}

function getSinglePhone(payload: any): string | null {
  if (!payload) return null
  if (typeof payload.phone === "string") return payload.phone
  if (Array.isArray(payload.phone_numbers) && payload.phone_numbers.length > 0) {
    return payload.phone_numbers[0]?.phone_number ?? null
  }
  if (typeof payload.phone_number === "string") return payload.phone_number
  return null
}

function getVerifiedAt(payload: any): Date | null {
  if (!payload) return null
  if (payload.email_verified === true) {
    return new Date()
  }

  const firstEmail = Array.isArray(payload.email_addresses) ? payload.email_addresses[0] : undefined
  if (firstEmail?.verification?.status === "verified") {
    return new Date()
  }

  return null
}

export async function handleClerkUserCreated(payload: any) {
  const clerkUserId = payload.id
  if (typeof clerkUserId !== "string") {
    throw new Error("Invalid Clerk user payload: missing id")
  }

  await prisma.user.upsert({
    where: { clerk_user_id: clerkUserId },
    create: {
      clerk_user_id: clerkUserId,
      phone: getSinglePhone(payload),
      email: getSingleEmail(payload),
      email_verified_at: getVerifiedAt(payload),
    },
    update: {
      phone: getSinglePhone(payload),
      email: getSingleEmail(payload),
      email_verified_at: getVerifiedAt(payload),
    },
  })
}

export async function handleClerkUserUpdated(payload: any) {
  const clerkUserId = payload.id
  if (typeof clerkUserId !== "string") {
    throw new Error("Invalid Clerk user payload: missing id")
  }

  await prisma.user.upsert({
    where: { clerk_user_id: clerkUserId },
    create: {
      clerk_user_id: clerkUserId,
      phone: getSinglePhone(payload),
      email: getSingleEmail(payload),
      email_verified_at: getVerifiedAt(payload),
    },
    update: {
      phone: getSinglePhone(payload),
      email: getSingleEmail(payload),
      email_verified_at: getVerifiedAt(payload),
    },
  })
}

export async function handleClerkUserDeleted(payload: any) {
  const clerkUserId = payload.id
  if (typeof clerkUserId !== "string") {
    throw new Error("Invalid Clerk user payload: missing id")
  }

  await prisma.user.updateMany({
    where: { clerk_user_id: clerkUserId },
    data: { deleted_at: new Date() },
  })
}
