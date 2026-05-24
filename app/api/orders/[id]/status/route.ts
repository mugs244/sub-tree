import { NextResponse } from "next/server"
import { getOrderStatus } from "@/lib/services/shop"

type Props = { params: Promise<{ id: string }> }

// id here is the idempotency_key (returned from /api/orders/initiate)
export async function GET(_req: Request, { params }: Props): Promise<NextResponse> {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })

  const order = await getOrderStatus(id)
  if (!order) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  return NextResponse.json({
    data: {
      order_id: order.id,
      payment_confirmed: order.payment_confirmed,
      escrow_status: order.escrow_status,
      product_type: order.product.product_type,
      shipping_info: order.product.shipping_info,
      has_download: !!order.download_token,
      download_expires_at: order.download_expires_at,
    },
  })
}
