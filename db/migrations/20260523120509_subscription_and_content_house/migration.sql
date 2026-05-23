-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContentHouseRequestStatus" AS ENUM ('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Tier" ADD VALUE 'BUSINESS';
ALTER TYPE "Tier" ADD VALUE 'CONTENT_HOUSE';

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "tier" "Tier" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "trial_ends_at" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "provider_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionEvent" (
    "id" SERIAL NOT NULL,
    "subscription_id" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentHouseRequest" (
    "id" SERIAL NOT NULL,
    "status" "ContentHouseRequestStatus" NOT NULL DEFAULT 'PENDING',
    "company_email" TEXT NOT NULL,
    "social_platforms" TEXT[],
    "features_requested" TEXT[],
    "notes" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentHouseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentHouseMember" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "share_rate" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "ContentHouseMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_user_id_key" ON "Subscription"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_idempotency_key_key" ON "Subscription"("idempotency_key");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_current_period_end_idx" ON "Subscription"("current_period_end");

-- CreateIndex
CREATE INDEX "Subscription_trial_ends_at_idx" ON "Subscription"("trial_ends_at");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_subscription_id_idx" ON "SubscriptionEvent"("subscription_id");

-- CreateIndex
CREATE INDEX "ContentHouseRequest_status_idx" ON "ContentHouseRequest"("status");

-- CreateIndex
CREATE INDEX "ContentHouseRequest_created_at_idx" ON "ContentHouseRequest"("created_at");

-- CreateIndex
CREATE INDEX "ContentHouseMember_request_id_idx" ON "ContentHouseMember"("request_id");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionEvent" ADD CONSTRAINT "SubscriptionEvent_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentHouseMember" ADD CONSTRAINT "ContentHouseMember_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "ContentHouseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
