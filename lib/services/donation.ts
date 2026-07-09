import { prisma } from "@/lib/db"
import { sendSms } from "@/lib/sms"
import { incrementRaisedAmount } from "@/lib/services/fundraiser"
import { getFeeRate } from "@/lib/services/platform-settings"
import type { MomoCallbackPayload } from "./momo/types"

export async function handleMomoCallback(
  payload: MomoCallbackPayload,
  rawBody: string,
): Promise<void> {
  const { referenceId, status, providerTxId, reason } = payload

  const donation = await prisma.donation.findUnique({
    where: { idempotency_key: referenceId },
    select: { id: true, status: true, fundraiser_id: true, amount: true },
  })

  // Unknown referenceId — ignore silently (prevents noisy logs on test pings)
  if (!donation) return

  // Already settled — idempotent return (dedup guard also skips raised_amount increment)
  if (donation.status === "COMPLETED" || donation.status === "FAILED") return

  const newStatus = status === "SUCCESSFUL" ? "COMPLETED" : "FAILED"

  // Recorded at completion time, using whatever rate is in effect right now —
  // this is the real fee split (Pesapal/MTN/Airtel collect into Sub-tree's own
  // merchant account; this is the ledger entry dividing it into platform
  // revenue vs. the creator's own withdrawable balance).
  let platformFee: number | null = null
  let creatorAmount: number | null = null
  if (newStatus === "COMPLETED") {
    const feeKey = donation.fundraiser_id ? "fee_fundraiser_free" : "fee_donation_free"
    const rate = await getFeeRate(feeKey, 0.05)
    platformFee = Math.round(donation.amount * rate)
    creatorAmount = donation.amount - platformFee
  }

  const updatedDonation = await prisma.$transaction(async (tx) => {
    const updated = await tx.donation.update({
      where: { id: donation.id },
      data: {
        status: newStatus,
        ...(providerTxId ? { provider_tx_id: providerTxId } : {}),
        ...(newStatus === "COMPLETED" ? { platform_fee: platformFee, creator_amount: creatorAmount } : {}),
      },
      select: { amount: true, donor_name: true, user_id: true },
    })

    await tx.donationEvent.create({
      data: {
        donation_id: donation.id,
        event_type: newStatus === "COMPLETED" ? "PAYMENT_COMPLETED" : "PAYMENT_FAILED",
        payload: {
          providerTxId: providerTxId ?? null,
          reason: reason ?? null,
          raw: rawBody,
        },
      },
    })

    if (newStatus === "COMPLETED" && donation.fundraiser_id) {
      await incrementRaisedAmount(donation.fundraiser_id, updated.amount, tx)
    }

    return updated
  })

  if (newStatus === "COMPLETED") {
    const creator = await prisma.user.findUnique({
      where: { id: updatedDonation.user_id },
      select: { phone: true },
    })
    if (creator?.phone) {
      const donor = updatedDonation.donor_name ?? "Someone"
      const amount = updatedDonation.amount.toLocaleString()
      await sendSms(creator.phone, `${donor} just donated UGX ${amount} to you on Sub-tree. 🎉`)
    }
  }
}
