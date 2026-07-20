import { redirect, notFound } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { getBookingForAdvertiser } from "@/lib/services/ad-slots"
import { AdEditor } from "@/components/business/AdEditor"

export default async function AdSlotEditorPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) redirect("/dashboard")

  const { bookingId } = await params
  const bookingIdNum = Number(bookingId)
  if (!Number.isInteger(bookingIdNum)) notFound()

  const booking = await getBookingForAdvertiser(advertiser.id, bookingIdNum)
  if (!booking) notFound()

  return (
    <AdEditor
      bookingId={booking.id}
      startsAt={booking.starts_at.toISOString()}
      endsAt={booking.ends_at.toISOString()}
      status={booking.status}
      companyName={advertiser.company_name}
      creative={
        booking.creative
          ? {
              format: booking.creative.format,
              mediaUrl: booking.creative.media_url,
              logoUrl: booking.creative.logo_url,
              appUrl: booking.creative.app_url,
              websiteUrl: booking.creative.website_url,
              productName: booking.creative.product_name,
              productDesc: booking.creative.product_desc,
            }
          : null
      }
    />
  )
}
