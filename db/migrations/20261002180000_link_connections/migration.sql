-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "connected_account_id" TEXT,
ADD COLUMN     "connected_at" TIMESTAMP(3),
ADD COLUMN     "connected_provider" TEXT;

