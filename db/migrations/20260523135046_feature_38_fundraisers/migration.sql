-- CreateEnum
CREATE TYPE "FundraiserType" AS ENUM ('PERSONAL', 'CHARITY');

-- CreateEnum
CREATE TYPE "FundraiserStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CharityApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "fundraiser_id" INTEGER;

-- CreateTable
CREATE TABLE "Fundraiser" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "fundraiser_type" "FundraiserType" NOT NULL DEFAULT 'PERSONAL',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goal_amount" BIGINT NOT NULL,
    "raised_amount" BIGINT NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "cover_image_url" TEXT,
    "show_progress" BOOLEAN NOT NULL DEFAULT true,
    "status" "FundraiserStatus" NOT NULL DEFAULT 'DRAFT',
    "charity_user_id" INTEGER,
    "charity_approval_status" "CharityApprovalStatus",
    "charity_split_creator_pct" INTEGER,
    "charity_split_charity_pct" INTEGER,
    "charity_approved_at" TIMESTAMP(3),
    "charity_rejected_at" TIMESTAMP(3),
    "charity_rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fundraiser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Fundraiser_user_id_idx" ON "Fundraiser"("user_id");

-- CreateIndex
CREATE INDEX "Fundraiser_charity_user_id_idx" ON "Fundraiser"("charity_user_id");

-- CreateIndex
CREATE INDEX "Fundraiser_status_idx" ON "Fundraiser"("status");

-- CreateIndex
CREATE INDEX "Donation_fundraiser_id_idx" ON "Donation"("fundraiser_id");

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_fundraiser_id_fkey" FOREIGN KEY ("fundraiser_id") REFERENCES "Fundraiser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fundraiser" ADD CONSTRAINT "Fundraiser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fundraiser" ADD CONSTRAINT "Fundraiser_charity_user_id_fkey" FOREIGN KEY ("charity_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
