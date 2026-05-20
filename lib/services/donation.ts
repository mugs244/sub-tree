import { prisma } from "@/lib/db"
import type { MomoCallbackPayload } from "./momo/types"

export async function handleMomoCallback(
  payload: MomoCallbackPayload,
  rawBody: string,
): Promise<void> {
  const { referenceId, status, providerTxId, reason } = payload

  const donation = await prisma.donation.findUnique({
    where: { idempotency_key: referenceId },
    select: { id: true, status: true },
  })

  // Unknown referenceId — ignore silently (prevents noisy logs on test pings)
  if (!donation) return

  // Already settled — idempotent return
  if (donation.status === "COMPLETED" || donation.status === "FAILED") return

  const newStatus = status === "SUCCESSFUL" ? "COMPLETED" : "FAILED"

  await prisma.$transaction([
    prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: newStatus,
        ...(providerTxId ? { provider_tx_id: providerTxId } : {}),
      },
    }),
    prisma.donationEvent.create({
      data: {
        donation_id: donation.id,
        event_type: newStatus === "COMPLETED" ? "PAYMENT_COMPLETED" : "PAYMENT_FAILED",
        payload: {
          providerTxId: providerTxId ?? null,
          reason: reason ?? null,
          raw: rawBody,
        },
      },
    }),
  ])
}
