import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { listMyProducts, createProduct, ShopError } from "@/lib/services/shop"

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  try {
    const products = await listMyProducts(userId)
    return NextResponse.json({ data: products })
  } catch (err) {
    if (err instanceof ShopError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 403 })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON" }, { status: 400 })
  }

  try {
    const product = await createProduct(userId, body)
    return NextResponse.json({ data: product }, { status: 201 })
  } catch (err) {
    if (err instanceof ShopError) {
      const status = err.code === "WRONG_TIER" ? 403 : err.code === "VALIDATION_ERROR" ? 400 : 500
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
