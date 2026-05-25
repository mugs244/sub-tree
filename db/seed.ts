import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { configDotenv } from "dotenv"

configDotenv({ path: ".env.local" })

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL must be set")

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const RESERVED_USERNAMES = [
  // Brand / product
  "subtree",
  "sub_tree",
  "admin",
  "support",
  "help",
  "info",
  "contact",
  "team",
  "staff",
  "official",
  "press",
  "blog",
  "news",
  "careers",
  "jobs",
  "status",
  "api",
  "docs",
  "legal",
  "privacy",
  "terms",
  "security",
  "trust",

  // Auth / system routes
  "login",
  "logout",
  "signup",
  "sign-up",
  "sign-in",
  "register",
  "forgot",
  "reset",
  "verify",
  "onboarding",
  "dashboard",
  "settings",
  "account",
  "profile",

  // Common squatting targets
  "god",
  "root",
  "system",
  "null",
  "undefined",
  "anonymous",
  "user",
  "guest",

  // Uganda / East Africa specific
  "uganda",
  "kenya",
  "tanzania",
  "rwanda",
  "mtn",
  "airtel",
  "africas-talking",

  // Common personal vanity
  "me",
  "you",
  "everyone",
  "someone",
]

const DEFAULT_PLATFORM_SETTINGS: Array<{ key: string; value: string; description: string }> = [
  { key: "fee_donation_free",                  value: "0.05",  description: "Donation platform fee — Free tier" },
  { key: "fee_donation_pro",                   value: "0.03",  description: "Donation platform fee — Pro tier" },
  { key: "fee_donation_business",              value: "0.03",  description: "Donation platform fee — Business tier" },
  { key: "fee_donation_content_house",         value: "0.03",  description: "Donation platform fee — Content House" },
  { key: "fee_shop_business",                  value: "0.08",  description: "Shop sale platform fee — Business tier" },
  { key: "fee_shop_content_house",             value: "0.08",  description: "Shop sale platform fee — Content House" },
  { key: "fee_fundraiser_free",                value: "0.05",  description: "Fundraiser platform fee — Free tier" },
  { key: "fee_fundraiser_pro",                 value: "0.03",  description: "Fundraiser platform fee — Pro+" },
  { key: "fee_subscription_default",           value: "0.05",  description: "Subscription fee — default flat rate" },
  { key: "fee_subscription_progressive_enabled", value: "false", description: "Toggle progressive subscription fees" },
  { key: "fee_subscription_tier_1_threshold", value: "100",   description: "Subscribers before lower rate kicks in" },
  { key: "fee_subscription_tier_1_rate",       value: "0.07",  description: "Fee rate below threshold" },
  { key: "fee_subscription_tier_2_rate",       value: "0.04",  description: "Fee rate above threshold" },
  { key: "affiliate_min_payout_ugx",           value: "5000",  description: "Minimum affiliate payout amount (UGX)" },
  { key: "escrow_default_release_days",        value: "7",     description: "Default escrow auto-release days" },
  { key: "max_dispute_window_days",            value: "14",    description: "Max days buyer can raise dispute" },
  { key: "platform_maintenance_mode",          value: "false", description: "503 all payment endpoints if true" },
  { key: "chat_max_conversations_per_day",     value: "50",    description: "Creator DM rate limit" },
  { key: "max_post_images",                    value: "4",     description: "Max images per creator post" },
  { key: "digital_download_max_count",         value: "3",     description: "Max downloads per digital purchase" },
  { key: "digital_download_expiry_hours",      value: "48",    description: "Hours before download link expires" },
]

async function seedPlatformSettings() {
  console.log("Seeding platform settings…")

  const results = await Promise.allSettled(
    DEFAULT_PLATFORM_SETTINGS.map((s) =>
      prisma.platformSetting.upsert({
        where: { key: s.key },
        create: { key: s.key, value: s.value, description: s.description },
        update: { description: s.description },
      }),
    ),
  )

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length
  console.log(`Platform settings: ${succeeded} upserted, ${failed} failed.`)
}

const PRODUCT_CATEGORIES = [
  { key: "clothing_tops",     label: "Tops & Shirts",          type: "physical", position: 1 },
  { key: "clothing_bottoms",  label: "Bottoms & Trousers",     type: "physical", position: 2 },
  { key: "clothing_dresses",  label: "Dresses",                type: "physical", position: 3 },
  { key: "clothing_outerwear",label: "Jackets & Coats",        type: "physical", position: 4 },
  { key: "accessories",       label: "Accessories",            type: "physical", position: 5 },
  { key: "footwear",          label: "Footwear",               type: "physical", position: 6 },
  { key: "music",             label: "Music & Beats",          type: "digital",  position: 7 },
  { key: "movies_video",      label: "Movies & Videos",        type: "digital",  position: 8 },
  { key: "digital_art",       label: "Digital Art",            type: "digital",  position: 9 },
  { key: "ebooks_pdfs",       label: "eBooks & PDFs",          type: "digital",  position: 10 },
  { key: "software",          label: "Software & Tools",       type: "digital",  position: 11 },
  { key: "courses",           label: "Courses & Tutorials",    type: "digital",  position: 12 },
  { key: "photography",       label: "Photography",            type: "digital",  position: 13 },
  { key: "wallpapers",        label: "Wallpapers & Backgrounds",type: "digital", position: 14 },
  { key: "other_digital",     label: "Other Digital",          type: "digital",  position: 15 },
  { key: "food_drink",        label: "Food & Drink",           type: "physical", position: 16 },
  { key: "beauty",            label: "Beauty & Skincare",      type: "physical", position: 17 },
  { key: "home",              label: "Home & Living",          type: "physical", position: 18 },
  { key: "other_physical",    label: "Other Physical",         type: "physical", position: 19 },
]

async function seedProductCategories() {
  const results = await Promise.allSettled(
    PRODUCT_CATEGORIES.map((cat) =>
      prisma.productCategory.upsert({
        where: { key: cat.key },
        create: cat,
        update: { label: cat.label, position: cat.position },
      }),
    ),
  )
  const succeeded = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length
  console.log(`Product categories: ${succeeded} upserted, ${failed} failed.`)
}

async function seed() {
  console.log("Seeding reserved usernames…")

  const results = await Promise.allSettled(
    RESERVED_USERNAMES.map((username) =>
      prisma.reservedUsername.upsert({
        where: { username },
        create: { username, reason: "System reserved" },
        update: {},
      }),
    ),
  )

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length
  console.log(`Done: ${succeeded} reserved, ${failed} failed.`)

  await seedPlatformSettings()
  await seedProductCategories()
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
