-- CreateEnum
CREATE TYPE "ContentMediaType" AS ENUM ('VIDEO', 'IMAGE');

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" SERIAL NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "caption" TEXT,
    "media_url" TEXT NOT NULL,
    "media_type" "ContentMediaType" NOT NULL DEFAULT 'VIDEO',
    "duration_sec" INTEGER,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentItem_deleted_at_created_at_idx" ON "ContentItem"("deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "ContentItem_creator_id_idx" ON "ContentItem"("creator_id");

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

