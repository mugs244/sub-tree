-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'BUSINESS', 'NGO');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "username" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "email_verified_at" TIMESTAMP(3),
    "account_type" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL',
    "tier" "Tier" NOT NULL DEFAULT 'FREE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservedUsername" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservedUsername_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsernameClaim" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsernameClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerk_user_id_key" ON "User"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_clerk_user_id_idx" ON "User"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ReservedUsername_username_key" ON "ReservedUsername"("username");

-- CreateIndex
CREATE INDEX "ReservedUsername_username_idx" ON "ReservedUsername"("username");

-- CreateIndex
CREATE INDEX "UsernameClaim_user_id_idx" ON "UsernameClaim"("user_id");

-- CreateIndex
CREATE INDEX "UsernameClaim_username_idx" ON "UsernameClaim"("username");

-- CreateIndex
CREATE INDEX "UsernameClaim_status_idx" ON "UsernameClaim"("status");

-- AddForeignKey
ALTER TABLE "UsernameClaim" ADD CONSTRAINT "UsernameClaim_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
