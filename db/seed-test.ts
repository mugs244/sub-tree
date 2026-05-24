/**
 * Test-data seed — creates one account per tier for manual QA.
 * Run: npx tsx db/seed-test.ts
 *
 * Safe to re-run (upserts everywhere). Does NOT touch reserved usernames.
 *
 * Credentials (Clerk login not required — these rows exist in DB only):
 *   clerk_user_id  |  username         | tier
 *   ───────────────|───────────────────|───────────────
 *   user_testfree  |  test_free        | FREE
 *   user_testpro   |  test_pro         | PRO
 *   user_testbiz   |  test_business    | BUSINESS
 *   user_testhouse |  test_house       | CONTENT_HOUSE
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { configDotenv } from "dotenv"

configDotenv({ path: ".env.local" })

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL must be set")

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const ONE_YEAR = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

// ─── helpers ─────────────────────────────────────────────────────────────────

async function upsertUser(data: {
  clerk_user_id: string
  username: string
  phone: string
  momo_number: string
  email: string
  tier: "FREE" | "PRO" | "BUSINESS" | "CONTENT_HOUSE"
}) {
  return prisma.user.upsert({
    where: { clerk_user_id: data.clerk_user_id },
    create: data,
    update: { tier: data.tier },
  })
}

async function upsertProfile(
  userId: number,
  data: {
    display_name: string
    bio?: string
    avatar_url?: string
    theme_preset?: string
    button_style?: string
    hide_branding?: boolean
    theme_bg_color?: string
    theme_accent_color?: string
    theme_button_color?: string
    theme_font?: string
  },
) {
  return prisma.profile.upsert({
    where: { user_id: userId },
    create: { user_id: userId, ...data },
    update: data,
  })
}

async function upsertSubscription(
  userId: number,
  tier: "PRO" | "BUSINESS" | "CONTENT_HOUSE",
  key: string,
) {
  return prisma.subscription.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      tier,
      status: "ACTIVE",
      current_period_end: ONE_YEAR,
      idempotency_key: key,
    },
    update: { tier, status: "ACTIVE", current_period_end: ONE_YEAR },
  })
}

async function replaceLinks(
  userId: number,
  links: { url: string; label: string; link_type?: "URL" | "SMART_CARD"; smart_card_meta?: object; position: number }[],
) {
  await prisma.link.deleteMany({ where: { user_id: userId } })
  await prisma.link.createMany({
    data: links.map((l) => ({
      user_id: userId,
      url: l.url,
      label: l.label,
      link_type: l.link_type ?? "URL",
      smart_card_meta: l.smart_card_meta ?? undefined,
      position: l.position,
      is_enabled: true,
    })),
  })
}

async function upsertProduct(
  userId: number,
  name: string,
  data: {
    description: string
    price: bigint
    product_type: "DIGITAL" | "PHYSICAL"
    file_url?: string
    stock?: number
    shipping_info?: string
    auto_release_days?: number
    affiliate_rate?: number
    affiliate_open?: boolean
    status?: "ACTIVE" | "INACTIVE"
  },
) {
  const existing = await prisma.product.findFirst({ where: { user_id: userId, name } })
  if (existing) {
    return prisma.product.update({ where: { id: existing.id }, data })
  }
  return prisma.product.create({
    data: { user_id: userId, name, ...data },
  })
}

// ─── FREE tier ───────────────────────────────────────────────────────────────

async function seedFree() {
  console.log("  → FREE (test_free)")
  const user = await upsertUser({
    clerk_user_id: "user_testfree",
    username: "test_free",
    phone: "+256700000001",
    momo_number: "0700000001",
    email: "test.free@subtree.test",
    tier: "FREE",
  })
  await upsertProfile(user.id, {
    display_name: "Free User",
    bio: "Testing the FREE tier — basic profile with links.",
    avatar_url: "https://api.dicebear.com/8.x/initials/svg?seed=FU&backgroundColor=e2e8f0",
    theme_preset: "default",
    button_style: "rounded",
  })
  await replaceLinks(user.id, [
    { url: "https://twitter.com/test_free", label: "Twitter", position: 0 },
    { url: "https://instagram.com/test_free", label: "Instagram", position: 1 },
    { url: "https://youtube.com/@test_free", label: "YouTube", position: 2 },
  ])
}

// ─── PRO tier ────────────────────────────────────────────────────────────────

async function seedPro() {
  console.log("  → PRO (test_pro)")
  const user = await upsertUser({
    clerk_user_id: "user_testpro",
    username: "test_pro",
    phone: "+256700000002",
    momo_number: "0700000002",
    email: "test.pro@subtree.test",
    tier: "PRO",
  })
  await upsertProfile(user.id, {
    display_name: "Pro Creator",
    bio: "Testing PRO — custom theme, Smart Cards, hide branding.",
    avatar_url: "https://api.dicebear.com/8.x/initials/svg?seed=PC&backgroundColor=dbeafe",
    theme_preset: "cool",
    button_style: "pill",
    hide_branding: true,
    theme_font: "inter",
  })
  await upsertSubscription(user.id, "PRO", "sub_testpro_001")
  await replaceLinks(user.id, [
    { url: "https://twitter.com/test_pro", label: "Twitter", position: 0 },
    { url: "https://instagram.com/test_pro", label: "Instagram", position: 1 },
    {
      url: "https://open.spotify.com/track/4iJyoBOLtHqaWYs3pugAVH",
      label: "Latest Track",
      link_type: "SMART_CARD",
      position: 2,
      smart_card_meta: {
        platform: "spotify",
        title: "Sample Track",
        description: "Pro Creator · Single",
        image_url: null,
        spotify: { track_name: "Sample Track", artist: "Pro Creator" },
      },
    },
    { url: "https://tiktok.com/@test_pro", label: "TikTok", position: 3 },
    { url: "https://linktr.ee/test_pro", label: "All my links", position: 4 },
  ])
}

// ─── BUSINESS tier ───────────────────────────────────────────────────────────

async function seedBusiness() {
  console.log("  → BUSINESS (test_business)")
  const user = await upsertUser({
    clerk_user_id: "user_testbiz",
    username: "test_business",
    phone: "+256700000003",
    momo_number: "0700000003",
    email: "test.business@subtree.test",
    tier: "BUSINESS",
  })
  await upsertProfile(user.id, {
    display_name: "Business Seller",
    bio: "Testing BUSINESS — shop, products, and affiliate network.",
    avatar_url: "https://api.dicebear.com/8.x/initials/svg?seed=BS&backgroundColor=dcfce7",
    theme_preset: "forest",
    button_style: "sharp",
    hide_branding: true,
    theme_font: "mono",
  })
  await upsertSubscription(user.id, "BUSINESS", "sub_testbiz_001")
  await replaceLinks(user.id, [
    { url: "https://twitter.com/test_business", label: "Twitter", position: 0 },
    { url: "https://instagram.com/test_business", label: "Shop Updates", position: 1 },
  ])

  // Products
  await upsertProduct(user.id, "Ugandan Music Production Kit", {
    description: "808 drum kits, sample packs, and MIDI loops curated for Afrobeat and Lugaflow producers.",
    price: BigInt(45000),
    product_type: "DIGITAL",
    file_url: "https://example.com/files/music-kit-v1.zip",
    affiliate_rate: 0.15,
    affiliate_open: true,
    auto_release_days: 3,
    status: "ACTIVE",
  })
  await upsertProduct(user.id, "Social Media Strategy Guide", {
    description: "Step-by-step PDF guide for growing your following in East African markets.",
    price: BigInt(20000),
    product_type: "DIGITAL",
    file_url: "https://example.com/files/social-guide.pdf",
    affiliate_rate: 0.20,
    affiliate_open: true,
    auto_release_days: 7,
    status: "ACTIVE",
  })
  await upsertProduct(user.id, "Branded Hoodie (M)", {
    description: "100% cotton hoodie with embroidered Sub-tree logo. Ships within Kampala.",
    price: BigInt(85000),
    product_type: "PHYSICAL",
    stock: 12,
    shipping_info: "Kampala delivery only. Contact seller to arrange pick-up.",
    affiliate_open: false,
    auto_release_days: 14,
    status: "ACTIVE",
  })
}

// ─── CONTENT_HOUSE tier ───────────────────────────────────────────────────────

async function seedContentHouse() {
  console.log("  → CONTENT_HOUSE (test_house)")
  const user = await upsertUser({
    clerk_user_id: "user_testhouse",
    username: "test_house",
    phone: "+256700000004",
    momo_number: "0700000004",
    email: "test.house@subtree.test",
    tier: "CONTENT_HOUSE",
  })
  await upsertProfile(user.id, {
    display_name: "The Content House",
    bio: "Top-tier creator collective — full platform access, shop, affiliates, custom theme.",
    avatar_url: "https://api.dicebear.com/8.x/initials/svg?seed=CH&backgroundColor=fae8ff",
    theme_preset: "midnight",
    button_style: "pill",
    hide_branding: true,
    theme_font: "inter",
    theme_accent_color: "#a855f7",
  })
  await upsertSubscription(user.id, "CONTENT_HOUSE", "sub_testhouse_001")
  await replaceLinks(user.id, [
    { url: "https://twitter.com/test_house", label: "Twitter", position: 0 },
    { url: "https://instagram.com/test_house", label: "Instagram", position: 1 },
    {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      label: "Latest Episode",
      link_type: "SMART_CARD",
      position: 2,
      smart_card_meta: {
        platform: "youtube",
        title: "Content House — Episode 42",
        description: "Our best episode yet.",
        image_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        youtube: { video_id: "dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg" },
      },
    },
    { url: "https://tiktok.com/@test_house", label: "TikTok", position: 3 },
    { url: "https://patreon.com/test_house", label: "Support on Patreon", position: 4 },
  ])

  // Products
  await upsertProduct(user.id, "Creator Course Bundle", {
    description: "Full content creation course: filming, editing, and monetisation for East African creators.",
    price: BigInt(150000),
    product_type: "DIGITAL",
    file_url: "https://example.com/files/creator-course.zip",
    affiliate_rate: 0.25,
    affiliate_open: true,
    auto_release_days: 3,
    status: "ACTIVE",
  })
  await upsertProduct(user.id, "Exclusive Merch Drop — T-Shirt", {
    description: "Limited edition Content House T-shirt. Premium quality, ships Uganda-wide.",
    price: BigInt(55000),
    product_type: "PHYSICAL",
    stock: 50,
    shipping_info: "Uganda-wide delivery via SafeBoda or Jumia. Allow 3–5 business days.",
    affiliate_open: false,
    auto_release_days: 14,
    status: "ACTIVE",
  })
}

// ─── Affiliate relationship: test_pro promotes test_business shop ─────────────

async function seedAffiliateRelationship() {
  console.log("  → Affiliate link: test_pro → test_business shop")
  const bizUser = await prisma.user.findUnique({ where: { username: "test_business" } })
  const proUser = await prisma.user.findUnique({ where: { username: "test_pro" } })
  if (!bizUser || !proUser) {
    console.log("    ⚠  Skipped — users not found")
    return
  }

  const existing = await prisma.affiliateRelationship.findUnique({
    where: { shop_user_id_affiliate_user_id: { shop_user_id: bizUser.id, affiliate_user_id: proUser.id } },
  })

  let rel = existing
  if (!rel) {
    rel = await prisma.affiliateRelationship.create({
      data: {
        shop_user_id: bizUser.id,
        affiliate_user_id: proUser.id,
        initiated_by: "MERCHANT_INVITE",
        status: "APPROVED",
        reviewed_at: new Date(),
      },
    })
  }

  // Grant all active products from test_business to test_pro
  const products = await prisma.product.findMany({
    where: { user_id: bizUser.id, status: "ACTIVE", affiliate_open: true },
  })
  for (const p of products) {
    await prisma.affiliateProductGrant.upsert({
      where: { relationship_id_product_id: { relationship_id: rel.id, product_id: p.id } },
      create: { relationship_id: rel.id, product_id: p.id },
      update: { revoked_at: null },
    })
  }
  console.log(`    ✓ ${products.length} product grant(s) set`)
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding test accounts…\n")
  await seedFree()
  await seedPro()
  await seedBusiness()
  await seedContentHouse()
  await seedAffiliateRelationship()
  console.log("\nDone. Test accounts ready.")
  console.log("\n  Public profiles:")
  console.log("    http://localhost:3000/test_free")
  console.log("    http://localhost:3000/test_pro")
  console.log("    http://localhost:3000/test_business")
  console.log("    http://localhost:3000/test_house")
  console.log("\n  Shops (BUSINESS+):")
  console.log("    http://localhost:3000/test_business/shop")
  console.log("    http://localhost:3000/test_house/shop")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
