/**
 * Test-data seed — creates one account per tier for manual QA.
 * Run: npx tsx db/seed-test.ts
 *
 * Safe to re-run (upserts on email). Does NOT touch reserved usernames.
 *
 * Credentials (sign in at /sign-in):
 *   email                     | password     | username       | tier
 *   ─────────────────────────|──────────────|────────────────|──────
 *   test.free@subtree.test   | testpass123  | test_free      | FREE
 *   test.pro@subtree.test    | testpass123  | test_pro       | PRO
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { configDotenv } from "dotenv"
import bcrypt from "bcryptjs"

configDotenv({ path: ".env.local" })

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL must be set")

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const PASSWORD_HASH = bcrypt.hashSync("testpass123", 12)

async function upsertUser(data: {
  email: string
  username: string
  phone: string
  momo_number: string
  tier: "FREE" | "PRO"
}) {
  return prisma.user.upsert({
    where: { email: data.email },
    create: {
      ...data,
      password_hash: PASSWORD_HASH,
      email_verified_at: new Date(),
    },
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

// ─── FREE tier ───────────────────────────────────────────────────────────────

async function seedFree() {
  console.log("  → FREE (test_free)")
  const user = await upsertUser({
    email: "test.free@subtree.test",
    username: "test_free",
    phone: "+256700000001",
    momo_number: "0700000001",
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
    email: "test.pro@subtree.test",
    username: "test_pro",
    phone: "+256700000002",
    momo_number: "0700000002",
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
  ])
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding test accounts…\n")
  await seedFree()
  await seedPro()
  console.log("\nDone. Test accounts ready.")
  console.log("\n  Public profiles:")
  console.log("    http://localhost:3000/test_free")
  console.log("    http://localhost:3000/test_pro")
  console.log("\n  Sign in at http://localhost:3000/sign-in")
  console.log("  Password for all accounts: testpass123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
