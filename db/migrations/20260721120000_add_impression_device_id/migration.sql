-- AlterTable
ALTER TABLE "AdImpression" ADD COLUMN     "device_id" TEXT;

-- CreateIndex
CREATE INDEX "AdImpression_device_id_viewed_at_idx" ON "AdImpression"("device_id", "viewed_at");
