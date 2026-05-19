import { defineConfig } from "@prisma/config"
import { configDotenv } from "dotenv"

configDotenv({ path: ".env.local" })

export default defineConfig({
  schema: "db/schema.prisma",
  migrations: {
    path: "db/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
