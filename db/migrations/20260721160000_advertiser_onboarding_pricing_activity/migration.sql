-- AlterTable
ALTER TABLE "AdSlotBooking" ADD COLUMN     "is_campaign" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Advertiser" ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "tin" TEXT;

-- CreateTable
CREATE TABLE "ActivityBucket" (
    "id" SERIAL NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "hour" INTEGER NOT NULL,
    "activity_count" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityBucket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActivityBucket_day_of_week_hour_key" ON "ActivityBucket"("day_of_week", "hour");

