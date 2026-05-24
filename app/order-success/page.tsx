import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"

type Props = { searchParams: Promise<{ ref?: string }> }

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { ref } = await searchParams
  if (!ref) notFound()

  const order = await prisma.order.findUnique({
    where: { idempotency_key: ref },
    select: {
      id: true, payment_confirmed: true, download_token: true,
      download_expires_at: true, download_count: true,
      product: { select: { name: true, product_type: true, shipping_info: true } },
      seller: { select: { username: true } },
    },
  })

  if (!order || !order.payment_confirmed) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <p className="text-2xl">⏳</p>
          <p className="text-base font-semibold">Still processing…</p>
          <p className="text-sm text-muted-foreground">
            Your payment is being verified. If your MoMo was deducted, your order will appear shortly.
          </p>
          <Link href="/" className="text-sm text-primary hover:underline">Return home</Link>
        </div>
      </main>
    )
  }

  const isDigital = order.product.product_type === "DIGITAL"

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full space-y-5">
        <div className="text-center space-y-2">
          <p className="text-3xl">🎉</p>
          <h1 className="text-lg font-semibold">Payment confirmed!</h1>
          <p className="text-sm text-muted-foreground">{order.product.name}</p>
        </div>

        {isDigital && order.download_token ? (
          <div className="bg-background border border-border rounded-xl p-5 space-y-3 text-center">
            <p className="text-sm font-medium">Your download is ready</p>
            <p className="text-xs text-muted-foreground">
              Valid for 48 hours · Max 3 downloads ({3 - order.download_count} remaining)
            </p>
            <a
              href={`/api/orders/${order.id}/download?token=${order.download_token}`}
              className="block w-full py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Download now
            </a>
            {order.download_expires_at && (
              <p className="text-[11px] text-muted-foreground">
                Expires {new Date(order.download_expires_at).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-background border border-border rounded-xl p-5 space-y-3">
            <p className="text-sm font-medium">Delivery information</p>
            {order.product.shipping_info ? (
              <p className="text-sm text-muted-foreground">{order.product.shipping_info}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                The creator will contact you with delivery details. Keep your reference: <strong>#{order.id}</strong>
              </p>
            )}
            <p className="text-xs text-muted-foreground border-t border-border pt-3">
              Funds are held in escrow and released to the seller after delivery is confirmed.
              You can raise a dispute if you don&apos;t receive your item.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Order #{order.id} · <Link href={`/${order.seller.username}`} className="hover:underline">Back to @{order.seller.username}</Link>
        </p>
      </div>
    </main>
  )
}
