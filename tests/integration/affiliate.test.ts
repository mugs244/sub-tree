import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../lib/db'
import { applyAsAffiliate, approveRequest } from '../../lib/services/affiliate'
import { initiateOrder } from '../../lib/services/shop'

// NOTE: This integration test requires a real test database. Set `DATABASE_URL` to a
// disposable test database and run `npm run seed:test` before running the test.

describe('Affiliate conversion flow (integration)', () => {
  let merchantClerkId = 'test-merchant-clerk-id'
  let promoterClerkId = 'test-promoter-clerk-id'
  let merchantUserId: number
  let promoterUserId: number
  let productId: number

  beforeAll(async () => {
    // Create merchant & promoter user records (minimal)
    const merchant = await prisma.user.create({ data: { clerk_user_id: merchantClerkId, username: 'merchant_test', tier: 'BUSINESS' } })
    const promoter = await prisma.user.create({ data: { clerk_user_id: promoterClerkId, username: 'promoter_test', tier: 'PRO' } })
    merchantUserId = merchant.id
    promoterUserId = promoter.id

    // Create a product open for affiliates
    const product = await prisma.product.create({ data: { user_id: merchantUserId, name: 'T-test', description: 'desc', price: BigInt(10000), product_type: 'DIGITAL', affiliate_rate: 0.1, affiliate_open: true } })
    productId = product.id
  })

  afterAll(async () => {
    await prisma.affiliateProductGrant.deleteMany({ where: { product_id: productId } }).catch(() => {})
    await prisma.order.deleteMany({ where: { product_id: productId } }).catch(() => {})
    await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {})
    await prisma.affiliateRelationship.deleteMany({ where: { shop_user_id: merchantUserId } }).catch(() => {})
    await prisma.user.deleteMany({ where: { clerk_user_id: { in: [merchantClerkId, promoterClerkId] } } }).catch(() => {})
    await prisma.$disconnect()
  })

  it('applies, merchant approves, and order attributes affiliate fields', async () => {
    // Promoter applies as affiliate
    await applyAsAffiliate(promoterClerkId, 'merchant_test')

    // Fetch the relationship id
    const rel = await prisma.affiliateRelationship.findFirst({ where: { shop_user_id: merchantUserId, affiliate_user_id: promoterUserId } })
    expect(rel).toBeTruthy()
    const relId = rel!.id

    // Merchant approves granting the product
    await approveRequest(merchantClerkId, relId, { product_ids: [productId] })

    // Simulate a checkout with ref cookie by calling initiateOrder with ref_cookie set to promoter user id string
    const orderResult = await initiateOrder({ product_id: productId, buyer_phone: '0777000000', buyer_name: 'Buyer', ref_cookie: String(promoterUserId) })
    expect(orderResult).toHaveProperty('order_id')

    const order = await prisma.order.findUnique({ where: { id: orderResult.order_id } })
    expect(order).toBeTruthy()
    expect(order?.affiliate_user_id).toBe(promoterUserId)
    expect(order?.affiliate_amount).toBeDefined()
  })
})
