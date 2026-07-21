-- CreateTable
CREATE TABLE "AdImpression" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "viewer_user_id" INTEGER,
    "age_group" TEXT,
    "region" TEXT,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdImpression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertiserPost" (
    "id" SERIAL NOT NULL,
    "advertiser_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "AdvertiserPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertiserPostComment" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "AdvertiserPostComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdImpression_booking_id_idx" ON "AdImpression"("booking_id");

-- CreateIndex
CREATE INDEX "AdImpression_booking_id_viewed_at_idx" ON "AdImpression"("booking_id", "viewed_at");

-- CreateIndex
CREATE INDEX "AdvertiserPost_advertiser_id_created_at_idx" ON "AdvertiserPost"("advertiser_id", "created_at");

-- CreateIndex
CREATE INDEX "AdvertiserPost_deleted_at_idx" ON "AdvertiserPost"("deleted_at");

-- CreateIndex
CREATE INDEX "AdvertiserPostComment_post_id_created_at_idx" ON "AdvertiserPostComment"("post_id", "created_at");

-- AddForeignKey
ALTER TABLE "AdImpression" ADD CONSTRAINT "AdImpression_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "AdSlotBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdImpression" ADD CONSTRAINT "AdImpression_viewer_user_id_fkey" FOREIGN KEY ("viewer_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertiserPost" ADD CONSTRAINT "AdvertiserPost_advertiser_id_fkey" FOREIGN KEY ("advertiser_id") REFERENCES "Advertiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertiserPost" ADD CONSTRAINT "AdvertiserPost_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertiserPostComment" ADD CONSTRAINT "AdvertiserPostComment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "AdvertiserPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertiserPostComment" ADD CONSTRAINT "AdvertiserPostComment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

