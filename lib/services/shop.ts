import { prisma } from "@/lib/db"
import { z } from "zod"
import { randomBytes, createHash } from "crypto"
import { randomUUID } from "crypto"
import { getFeeRate, getSettingAsNumber } from "@/lib/services/platform-settings"

export class ShopError extends Error {
  constructor(
    public readonly code:
      | "USER_NOT_FOUND"
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "VALIDATION_ERROR"
      | "WRONG_TIER"
      | "OUT_OF_STOCK"
      | "ORDER_NOT_FOUND"
      | "DOWNLOAD_INVALID"
      | "DOWNLOAD_EXPIRED"
      | "DOWNLOAD_LIMIT"
      | "ALREADY_DISPUTED"
      | "ESCROW_NOT_HELD",
    message: string,
  ) {
    super(message)
    this.name = "ShopError"
  }
}

const BUSINESS_TIERS = ["BUSINESS", "CONTENT_HOUSE"]

// ── Validators ────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name:             z.string().min(2, "Name must be at least 2 characters").max(120).trim(),
  description:      z.string().min(10, "Description must be at least 10 characters").max(2000).trim(),
  price:            z.number().int().positive("Price must be a positive amount"),
  product_type:     z.enum(["DIGITAL", "PHYSICAL"]),
  category_id:      z.number().int().positive().optional(),
  cover_image_url:  z.url().optional(),
  file_url:         z.url().optional(),
  file_size_bytes:  z.number().int().positive().optional(),
  shipping_info:    z.string().max(1000).optional(),
  stock:            z.number().int().min(0).nullable().optional(),
  auto_release_days: z.number().int().min(3).max(14).default(7),
  affiliate_rate:   z.number().min(0).max(0.5).default(0),
  affiliate_open:   z.boolean().default(false),
})

export const updateProductSchema = z.object({
  name:             z.string().min(2).max(120).trim().optional(),
  description:      z.string().min(10).max(2000).trim().optional(),
  price:            z.number().int().positive().optional(),
  category_id:      z.number().int().positive().nullable().optional(),
  cover_image_url:  z.url().nullable().optional(),
  file_url:         z.url().nullable().optional(),
  file_size_bytes:  z.number().int().positive().nullable().optional(),
  shipping_info:    z.string().max(1000).nullable().optional(),
  stock:            z.number().int().min(0).nullable().optional(),
  auto_release_days: z.number().int().min(3).max(14).optional(),
  affiliate_rate:   z.number().min(0).max(0.5).optional(),
  affiliate_open:   z.boolean().optional(),
  status:           z.enum(["ACTIVE", "INACTIVE"]).optional(),
}).refine((d) => Object.keys(d).length > 0, "At least one field required")

export const initiateOrderSchema = z.object({
  product_id:    z.number().int().positive(),
  buyer_phone:   z.string().min(9, "Invalid phone number"),
  buyer_name:    z.string().min(1).max(100).trim(),
  buyer_email:   z.string().email().optional(),
  ref_cookie:    z.string().optional(), // affiliate user_id from cookie
})

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolveUser(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkUserId },
    select: { id: true, tier: true },
  })
  if (!user) throw new ShopError("USER_NOT_FOUND", "User record not found")
  return user
}

async function resolveProduct(id: number, userId: number) {
  const p = await prisma.product.findUnique({ where: { id } })
  if (!p) throw new ShopError("NOT_FOUND", "Product not found")
  if (p.user_id !== userId) throw new ShopError("FORBIDDEN", "Not your product")
  return p
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function listMyProducts(clerkUserId: string) {
  const user = await resolveUser(clerkUserId)
  return prisma.product.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
    select: {
      id: true, name: true, description: true, price: true,
      product_type: true, cover_image_url: true, stock: true,
      auto_release_days: true, affiliate_rate: true, affiliate_open: true,
      status: true, created_at: true,
      _count: { select: { orders: { where: { payment_confirmed: true } } } },
    },
  })
}

export async function getPublicProduct(id: number) {
  return prisma.product.findUnique({
    where: { id, status: "ACTIVE" },
    select: {
      id: true, name: true, description: true, price: true,
      product_type: true, cover_image_url: true, stock: true,
      shipping_info: true, affiliate_rate: true, affiliate_open: true,
      user: {
        select: {
          username: true, deleted_at: true,
          profile: { select: { display_name: true, avatar_url: true } },
        },
      },
    },
  })
}

export async function getPublicShop(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, deleted_at: true, tier: true },
  })
  if (!user || user.deleted_at || !BUSINESS_TIERS.includes(user.tier)) return null

  return prisma.product.findMany({
    where: { user_id: user.id, status: "ACTIVE" },
    orderBy: { created_at: "desc" },
    select: {
      id: true, name: true, price: true, cover_image_url: true,
      product_type: true, stock: true,
    },
  })
}

export async function listMyOrders(clerkUserId: string, page = 1) {
  const user = await resolveUser(clerkUserId)
  const take = 50
  return prisma.order.findMany({
    where: { seller_user_id: user.id, payment_confirmed: true },
    orderBy: { created_at: "desc" },
    skip: (page - 1) * take,
    take,
    select: {
      id: true, buyer_name: true, buyer_phone: true, buyer_email: true,
      amount_paid: true, platform_fee: true, seller_amount: true,
      escrow_status: true, escrow_release_at: true, dispute_raised_at: true,
      released_at: true, created_at: true, affiliate_amount: true,
      product: { select: { id: true, name: true, product_type: true } },
    },
  })
}

export async function getEscrowSummary(clerkUserId: string) {
  const user = await resolveUser(clerkUserId)
  const held = await prisma.order.aggregate({
    where: { seller_user_id: user.id, payment_confirmed: true, escrow_status: "HELD" },
    _sum: { seller_amount: true },
    _count: { id: true },
  })
  const disputed = await prisma.order.count({
    where: { seller_user_id: user.id, payment_confirmed: true, escrow_status: "DISPUTED" },
  })
  const next = await prisma.order.findFirst({
    where: {
      seller_user_id: user.id, payment_confirmed: true,
      escrow_status: "HELD", dispute_raised_at: null,
    },
    orderBy: { escrow_release_at: "asc" },
    select: { escrow_release_at: true },
  })
  return {
    held_amount: held._sum.seller_amount ?? BigInt(0),
    held_count: held._count.id,
    disputed_count: disputed,
    next_release_at: next?.escrow_release_at ?? null,
  }
}

export async function getOrderStatus(idempotencyKey: string) {
  return prisma.order.findUnique({
    where: { idempotency_key: idempotencyKey },
    select: {
      id: true, payment_confirmed: true, escrow_status: true,
      download_token: true, download_expires_at: true,
      product: { select: { product_type: true, shipping_info: true } },
    },
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createProduct(clerkUserId: string, input: unknown) {
  const parsed = createProductSchema.safeParse(input)
  if (!parsed.success) {
    throw new ShopError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const user = await resolveUser(clerkUserId)
  if (!BUSINESS_TIERS.includes(user.tier)) {
    throw new ShopError("WRONG_TIER", "Business tier required to create products")
  }

  const { price, file_size_bytes, affiliate_rate, ...rest } = parsed.data
  return prisma.product.create({
    data: {
      user_id: user.id,
      price: BigInt(price),
      file_size_bytes: file_size_bytes ? BigInt(file_size_bytes) : null,
      affiliate_rate: affiliate_rate,
      ...rest,
    },
    select: { id: true },
  })
}

export async function updateProduct(clerkUserId: string, id: number, input: unknown) {
  const parsed = updateProductSchema.safeParse(input)
  if (!parsed.success) {
    throw new ShopError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const user = await resolveUser(clerkUserId)
  await resolveProduct(id, user.id)

  const { price, file_size_bytes, ...rest } = parsed.data
  await prisma.product.update({
    where: { id },
    data: {
      ...rest,
      ...(price !== undefined ? { price: BigInt(price) } : {}),
      ...(file_size_bytes !== undefined
        ? { file_size_bytes: file_size_bytes !== null ? BigInt(file_size_bytes) : null }
        : {}),
    },
  })
}

export async function deactivateProduct(clerkUserId: string, id: number) {
  const user = await resolveUser(clerkUserId)
  await resolveProduct(id, user.id)
  await prisma.product.update({ where: { id }, data: { status: "INACTIVE" } })
}

export async function initiateOrder(input: unknown) {
  const parsed = initiateOrderSchema.safeParse(input)
  if (!parsed.success) {
    throw new ShopError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const { product_id, buyer_phone, buyer_name, buyer_email, ref_cookie } = parsed.data

  const product = await prisma.product.findUnique({
    where: { id: product_id, status: "ACTIVE" },
    select: { id: true, price: true, user_id: true, auto_release_days: true, affiliate_rate: true },
  })
  if (!product) throw new ShopError("NOT_FOUND", "Product not found or inactive")

  // Stock check for physical
  const full = await prisma.product.findUnique({
    where: { id: product_id },
    select: { stock: true, product_type: true },
  })
  if (full?.stock !== null && full?.stock !== undefined && full.stock <= 0) {
    throw new ShopError("OUT_OF_STOCK", "Product is out of stock")
  }

  // Resolve affiliate from cookie (ref_cookie is the affiliate's user_id as string)
  let affiliateUserId: number | null = null
  let affiliateAmount: bigint | null = null

  if (ref_cookie) {
    const refId = parseInt(ref_cookie, 10)
    if (!isNaN(refId) && refId !== product.user_id) {
      // Validate relationship + product grant
      const grant = await prisma.affiliateProductGrant.findFirst({
        where: {
          product_id: product.id,
          revoked_at: null,
          relationship: {
            affiliate_user_id: refId,
            shop_user_id: product.user_id,
            status: "APPROVED",
          },
        },
      })
      if (grant) {
        affiliateUserId = refId
        const rate = Number(product.affiliate_rate)
        affiliateAmount = BigInt(Math.floor(Number(product.price) * rate))
      }
    }
  }

  const amountPaid = product.price
  const feeRate = await getFeeRate("fee_shop_business", 0.08)
  const platformFee = BigInt(Math.floor(Number(amountPaid) * feeRate))
  const sellerAmount = amountPaid - platformFee - (affiliateAmount ?? BigInt(0))

  const normalized = buyer_phone
    .replace(/\s+/g, "")
    .replace(/^\+256/, "0")
    .replace(/^256/, "0")

  const idempotencyKey = randomUUID()

  const order = await prisma.order.create({
    data: {
      product_id: product.id,
      seller_user_id: product.user_id,
      affiliate_user_id: affiliateUserId,
      buyer_phone: normalized,
      buyer_name,
      buyer_email: buyer_email ?? null,
      amount_paid: amountPaid,
      platform_fee: platformFee,
      seller_amount: sellerAmount,
      affiliate_amount: affiliateAmount,
      idempotency_key: idempotencyKey,
      pesapal_provider: "PESAPAL",
      escrow_release_at: new Date(
        Date.now() + product.auto_release_days * 24 * 60 * 60 * 1000,
      ),
    },
    select: { id: true, idempotency_key: true },
  })

  return { order_id: order.id, idempotency_key: order.idempotency_key, amount: Number(amountPaid) }
}

export async function confirmOrderPayment(
  idempotencyKey: string,
  pesapalTxnId: string,
) {
  const order = await prisma.order.findUnique({
    where: { idempotency_key: idempotencyKey },
    select: {
      id: true, payment_confirmed: true, product_id: true,
      buyer_email: true, buyer_phone: true,
    },
  })
  if (!order) return null
  if (order.payment_confirmed) return order // idempotent

  const product = await prisma.product.findUnique({
    where: { id: order.product_id },
    select: { product_type: true, stock: true },
  })

  // Generate download token for digital products
  let downloadToken: string | null = null
  let rawToken: string | null = null
  let downloadExpiresAt: Date | null = null

  if (product?.product_type === "DIGITAL") {
    const raw = randomBytes(32).toString("base64url")
    rawToken = raw
    downloadToken = raw // stored directly; URL-safe base64 is opaque enough for v2
    const expiryHours = await getSettingAsNumber("digital_download_expiry_hours", 48)
    downloadExpiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000)
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        payment_confirmed: true,
        pesapal_txn_id: pesapalTxnId,
        download_token: downloadToken,
        download_expires_at: downloadExpiresAt,
      },
    })

    await tx.orderEvent.create({
      data: {
        order_id: order.id,
        event_type: "PAYMENT_CONFIRMED",
        metadata: JSON.parse(JSON.stringify({ pesapal_txn_id: pesapalTxnId })),
      },
    })

    // Decrement stock for physical products if stock is tracked
    if (product?.product_type === "PHYSICAL" && product.stock !== null) {
      await tx.product.update({
        where: { id: order.product_id },
        data: { stock: { decrement: 1 } },
      })
      // Mark SOLD_OUT if stock hits 0
      const updated = await tx.product.findUnique({
        where: { id: order.product_id },
        select: { stock: true },
      })
      if (updated?.stock === 0) {
        await tx.product.update({
          where: { id: order.product_id },
          data: { status: "SOLD_OUT" },
        })
      }
    }
  })

  return { order_id: order.id, raw_download_token: rawToken }
}

export async function getDownloadUrl(orderId: number, rawToken: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      download_token: true, download_expires_at: true, download_count: true,
      payment_confirmed: true,
      product: { select: { file_url: true, product_type: true } },
    },
  })
  if (!order || !order.payment_confirmed) throw new ShopError("ORDER_NOT_FOUND", "Order not found")
  if (order.product.product_type !== "DIGITAL") throw new ShopError("DOWNLOAD_INVALID", "Not a digital product")
  if (!order.download_token) throw new ShopError("DOWNLOAD_INVALID", "No download token")

  const hash = createHash("sha256").update(rawToken).digest("hex")
  if (hash !== order.download_token) throw new ShopError("DOWNLOAD_INVALID", "Invalid token")

  if (order.download_expires_at && order.download_expires_at < new Date()) {
    throw new ShopError("DOWNLOAD_EXPIRED", "Download link has expired")
  }
  const maxDownloads = await getSettingAsNumber("digital_download_max_count", 3)
  if (order.download_count >= maxDownloads) {
    throw new ShopError("DOWNLOAD_LIMIT", "Download limit reached")
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { download_count: { increment: 1 } },
    })
    await tx.orderEvent.create({
      data: {
        order_id: orderId,
        event_type: "DOWNLOAD_ACCESSED",
        metadata: JSON.parse(JSON.stringify({ count: order.download_count + 1 })),
      },
    })
  })

  return order.product.file_url
}

export async function raiseDispute(orderId: number, buyerPhone: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      buyer_phone: true, payment_confirmed: true,
      escrow_status: true, dispute_raised_at: true, escrow_release_at: true,
    },
  })
  if (!order || !order.payment_confirmed) throw new ShopError("ORDER_NOT_FOUND", "Order not found")

  const normalized = buyerPhone.replace(/\s+/g, "").replace(/^\+256/, "0").replace(/^256/, "0")
  if (order.buyer_phone !== normalized) throw new ShopError("FORBIDDEN", "Not your order")
  if (order.escrow_status !== "HELD") throw new ShopError("ESCROW_NOT_HELD", "Order cannot be disputed in its current state")
  if (order.dispute_raised_at) throw new ShopError("ALREADY_DISPUTED", "Dispute already raised")

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { escrow_status: "DISPUTED", dispute_raised_at: new Date() },
    })
    await tx.orderEvent.create({
      data: { order_id: orderId, event_type: "DISPUTE_RAISED" },
    })
  })
}

export async function releaseBySeller(clerkUserId: string, orderId: number) {
  const user = await resolveUser(clerkUserId)
  const order = await prisma.order.findUnique({
    where: { id: orderId, seller_user_id: user.id },
    select: { payment_confirmed: true, escrow_status: true },
  })
  if (!order || !order.payment_confirmed) throw new ShopError("ORDER_NOT_FOUND", "Order not found")
  if (order.escrow_status !== "HELD") throw new ShopError("ESCROW_NOT_HELD", "Order is not in HELD state")

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { escrow_status: "RELEASED", released_at: new Date() },
    })
    await tx.orderEvent.create({
      data: {
        order_id: orderId,
        event_type: "ESCROW_RELEASED",
        actor_id: user.id,
        metadata: JSON.parse(JSON.stringify({ method: "seller_manual" })),
      },
    })
  })
}

export async function listAdminDisputes() {
  return prisma.order.findMany({
    where: { escrow_status: "DISPUTED" },
    orderBy: { dispute_raised_at: "asc" },
    select: {
      id: true, buyer_name: true, buyer_phone: true, buyer_email: true,
      amount_paid: true, seller_amount: true, dispute_raised_at: true,
      product: { select: { name: true, product_type: true } },
      seller: { select: { username: true } },
    },
  })
}

export async function resolveDispute(orderId: number, action: "release" | "refund") {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { escrow_status: true, payment_confirmed: true },
  })
  if (!order || !order.payment_confirmed) throw new ShopError("ORDER_NOT_FOUND", "Order not found")
  if (order.escrow_status !== "DISPUTED") throw new ShopError("ESCROW_NOT_HELD", "Order is not in DISPUTED state")

  const newStatus = action === "release" ? "RELEASED" : "REFUNDED"
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        escrow_status: newStatus,
        ...(action === "release" ? { released_at: new Date() } : {}),
      },
    })
    await tx.orderEvent.create({
      data: {
        order_id: orderId,
        event_type: "DISPUTE_RESOLVED",
        metadata: JSON.parse(JSON.stringify({ action })),
      },
    })
  })
}

// ── Escrow cron ───────────────────────────────────────────────────────────────

export async function runEscrowRelease() {
  const orders = await prisma.order.findMany({
    where: {
      payment_confirmed: true,
      escrow_status: "HELD",
      dispute_raised_at: null,
      escrow_release_at: { lte: new Date() },
    },
    select: { id: true, seller_user_id: true, seller_amount: true },
  })

  const results = { released: 0, failed: 0 }

  for (const order of orders) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { escrow_status: "RELEASED", released_at: new Date() },
        })
        await tx.orderEvent.create({
          data: {
            order_id: order.id,
            event_type: "ESCROW_RELEASED",
            metadata: JSON.parse(JSON.stringify({ method: "auto_cron" })),
          },
        })
      })
      results.released++
    } catch (err) {
      console.error("Escrow release failed for order", order.id, err)
      results.failed++
    }
  }

  return results
}
