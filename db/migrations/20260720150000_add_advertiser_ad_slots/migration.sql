-- CreateEnum
CREATE TYPE "AdvertiserPlan" AS ENUM ('STARTUP', 'GROWTH', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "AdvertiserVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED');

-- CreateEnum
CREATE TYPE "AdvertiserRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "AdSlotDurationType" AS ENUM ('HOUR', 'DAY', 'WEEK', 'BIWEEKLY', 'MONTH');

-- CreateEnum
CREATE TYPE "AdSlotBookingStatus" AS ENUM ('DRAFT', 'READY', 'PUBLISHED', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AdFormat" AS ENUM ('BANNER', 'VIDEO', 'SLIDE_UP_POPUP');

-- CreateEnum
CREATE TYPE "AdvertiserWalletTxType" AS ENUM ('TOPUP', 'SLOT_PURCHASE', 'RERUN_PURCHASE', 'REFUND', 'CREDIT_PURCHASE');

-- AlterEnum
ALTER TYPE "AccountType" ADD VALUE 'ADVERTISER';

-- CreateTable
CREATE TABLE "Advertiser" (
    "id" SERIAL NOT NULL,
    "company_name" TEXT NOT NULL,
    "plan" "AdvertiserPlan" NOT NULL DEFAULT 'STARTUP',
    "verification_status" "AdvertiserVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "wallet_balance_ugx" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertiser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertiserMember" (
    "id" SERIAL NOT NULL,
    "advertiser_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "AdvertiserRole" NOT NULL DEFAULT 'EDITOR',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joined_at" TIMESTAMP(3),

    CONSTRAINT "AdvertiserMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdSlotBooking" (
    "id" SERIAL NOT NULL,
    "advertiser_id" INTEGER NOT NULL,
    "booked_by" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "duration_type" "AdSlotDurationType" NOT NULL,
    "price_ugx" INTEGER NOT NULL,
    "status" "AdSlotBookingStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdSlotBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCreative" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "format" "AdFormat" NOT NULL,
    "media_url" TEXT,
    "logo_url" TEXT,
    "app_url" TEXT,
    "website_url" TEXT,
    "product_name" TEXT,
    "product_desc" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCreative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdRerun" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "rerun_date" TIMESTAMP(3) NOT NULL,
    "price_ugx" INTEGER NOT NULL,
    "status" "AdSlotBookingStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdRerun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertiserWalletTransaction" (
    "id" SERIAL NOT NULL,
    "advertiser_id" INTEGER NOT NULL,
    "type" "AdvertiserWalletTxType" NOT NULL,
    "amount_ugx" INTEGER NOT NULL,
    "balance_after_ugx" BIGINT NOT NULL,
    "related_booking_id" INTEGER,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvertiserWalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertiserCreditPurchase" (
    "id" SERIAL NOT NULL,
    "advertiser_id" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,
    "price_ugx" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvertiserCreditPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Advertiser_verification_status_idx" ON "Advertiser"("verification_status");

-- CreateIndex
CREATE INDEX "AdvertiserMember_user_id_idx" ON "AdvertiserMember"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "AdvertiserMember_advertiser_id_user_id_key" ON "AdvertiserMember"("advertiser_id", "user_id");

-- CreateIndex
CREATE INDEX "AdSlotBooking_advertiser_id_idx" ON "AdSlotBooking"("advertiser_id");

-- CreateIndex
CREATE INDEX "AdSlotBooking_status_idx" ON "AdSlotBooking"("status");

-- CreateIndex
CREATE INDEX "AdSlotBooking_starts_at_ends_at_idx" ON "AdSlotBooking"("starts_at", "ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "AdCreative_booking_id_key" ON "AdCreative"("booking_id");

-- CreateIndex
CREATE INDEX "AdRerun_booking_id_idx" ON "AdRerun"("booking_id");

-- CreateIndex
CREATE INDEX "AdRerun_rerun_date_idx" ON "AdRerun"("rerun_date");

-- CreateIndex
CREATE INDEX "AdvertiserWalletTransaction_advertiser_id_idx" ON "AdvertiserWalletTransaction"("advertiser_id");

-- CreateIndex
CREATE INDEX "AdvertiserWalletTransaction_type_idx" ON "AdvertiserWalletTransaction"("type");

-- CreateIndex
CREATE INDEX "AdvertiserCreditPurchase_advertiser_id_idx" ON "AdvertiserCreditPurchase"("advertiser_id");

-- AddForeignKey
ALTER TABLE "AdvertiserMember" ADD CONSTRAINT "AdvertiserMember_advertiser_id_fkey" FOREIGN KEY ("advertiser_id") REFERENCES "Advertiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertiserMember" ADD CONSTRAINT "AdvertiserMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSlotBooking" ADD CONSTRAINT "AdSlotBooking_advertiser_id_fkey" FOREIGN KEY ("advertiser_id") REFERENCES "Advertiser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSlotBooking" ADD CONSTRAINT "AdSlotBooking_booked_by_fkey" FOREIGN KEY ("booked_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCreative" ADD CONSTRAINT "AdCreative_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "AdSlotBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdRerun" ADD CONSTRAINT "AdRerun_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "AdSlotBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertiserWalletTransaction" ADD CONSTRAINT "AdvertiserWalletTransaction_advertiser_id_fkey" FOREIGN KEY ("advertiser_id") REFERENCES "Advertiser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertiserCreditPurchase" ADD CONSTRAINT "AdvertiserCreditPurchase_advertiser_id_fkey" FOREIGN KEY ("advertiser_id") REFERENCES "Advertiser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
