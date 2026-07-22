-- CreateEnum
CREATE TYPE "AdvertiserPaymentKind" AS ENUM ('SUBSCRIPTION', 'WALLET_TOPUP');

-- CreateEnum
CREATE TYPE "AdvertiserPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Advertiser" ADD COLUMN     "subscription_active_until" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AdvertiserPayment" (
    "id" SERIAL NOT NULL,
    "advertiser_id" INTEGER NOT NULL,
    "kind" "AdvertiserPaymentKind" NOT NULL,
    "amount_ugx" INTEGER NOT NULL,
    "status" "AdvertiserPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" TEXT NOT NULL,
    "provider_tx_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "AdvertiserPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdvertiserPayment_idempotency_key_key" ON "AdvertiserPayment"("idempotency_key");

-- CreateIndex
CREATE INDEX "AdvertiserPayment_advertiser_id_idx" ON "AdvertiserPayment"("advertiser_id");

-- CreateIndex
CREATE INDEX "AdvertiserPayment_status_idx" ON "AdvertiserPayment"("status");

-- AddForeignKey
ALTER TABLE "AdvertiserPayment" ADD CONSTRAINT "AdvertiserPayment_advertiser_id_fkey" FOREIGN KEY ("advertiser_id") REFERENCES "Advertiser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

