-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "referrer_source" TEXT;

-- AlterTable
ALTER TABLE "DonationEvent" ADD COLUMN     "read_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DonationEvent_donation_id_read_at_idx" ON "DonationEvent"("donation_id", "read_at");
