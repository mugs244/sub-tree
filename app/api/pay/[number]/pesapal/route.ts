import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { startPesapalCheckout, BillingError } from "@/lib/services/billing"

type Props = { params: Promise<{ number: string }> }

// Opens Pesapal's checkout (card or mobile money) for an invoice; the Sub-pay
// page shows the returned URL in an iframe.
export async function POST(req: Request, { params }: Props): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  try {
    const url = await startPesapalCheckout(session.userId, (await params).number, new URL(req.url).origin)
    return NextResponse.json({ data: { url } })
  } catch (err) {
    if (err instanceof BillingError) return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    console.error("Pesapal checkout failed", err)
    return NextResponse.json({ error: "PAYMENT_ERROR", message: "Couldn't open the payment window. Please try again." }, { status: 502 })
  }
}
