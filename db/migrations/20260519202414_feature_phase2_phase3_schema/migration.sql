-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "MomoProvider" AS ENUM ('MTN_MOMO', 'AIRTEL_MONEY');

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "clicks" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "button_style" TEXT NOT NULL DEFAULT 'rounded',
ADD COLUMN     "theme_preset" TEXT NOT NULL DEFAULT 'default';

-- CreateTable
CREATE TABLE "Donation" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "donor_phone" TEXT NOT NULL,
    "donor_name" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "MomoProvider" NOT NULL,
    "provider_tx_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationEvent" (
    "id" SERIAL NOT NULL,
    "donation_id" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Donation_provider_tx_id_key" ON "Donation"("provider_tx_id");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_idempotency_key_key" ON "Donation"("idempotency_key");

-- CreateIndex
CREATE INDEX "Donation_user_id_idx" ON "Donation"("user_id");

-- CreateIndex
CREATE INDEX "Donation_status_idx" ON "Donation"("status");

-- CreateIndex
CREATE INDEX "Donation_user_id_status_idx" ON "Donation"("user_id", "status");

-- CreateIndex
CREATE INDEX "DonationEvent_donation_id_idx" ON "DonationEvent"("donation_id");

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationEvent" ADD CONSTRAINT "DonationEvent_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "Donation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
