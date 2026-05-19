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
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
