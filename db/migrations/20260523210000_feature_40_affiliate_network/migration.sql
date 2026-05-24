-- CreateEnum
CREATE TYPE "AffiliateInitiator" AS ENUM ('CREATOR_REQUEST', 'MERCHANT_INVITE');

-- CreateEnum
CREATE TYPE "AffiliateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "AffiliateRelationship" (
    "id" SERIAL NOT NULL,
    "shop_user_id" INTEGER NOT NULL,
    "affiliate_user_id" INTEGER NOT NULL,
    "initiated_by" "AffiliateInitiator" NOT NULL,
    "status" "AffiliateStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateProductGrant" (
    "id" SERIAL NOT NULL,
    "relationship_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "AffiliateProductGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliatePayoutRecord" (
    "id" SERIAL NOT NULL,
    "affiliate_user_id" INTEGER NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_amount" BIGINT NOT NULL,
    "order_count" INTEGER NOT NULL,
    "pesapal_txn_id" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "failure_reason" TEXT,

    CONSTRAINT "AffiliatePayoutRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateRelationship_shop_user_id_affiliate_user_id_key" ON "AffiliateRelationship"("shop_user_id", "affiliate_user_id");

-- CreateIndex
CREATE INDEX "AffiliateRelationship_shop_user_id_idx" ON "AffiliateRelationship"("shop_user_id");

-- CreateIndex
CREATE INDEX "AffiliateRelationship_affiliate_user_id_idx" ON "AffiliateRelationship"("affiliate_user_id");

-- CreateIndex
CREATE INDEX "AffiliateRelationship_status_idx" ON "AffiliateRelationship"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProductGrant_relationship_id_product_id_key" ON "AffiliateProductGrant"("relationship_id", "product_id");

-- CreateIndex
CREATE INDEX "AffiliateProductGrant_relationship_id_idx" ON "AffiliateProductGrant"("relationship_id");

-- CreateIndex
CREATE INDEX "AffiliateProductGrant_product_id_idx" ON "AffiliateProductGrant"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliatePayoutRecord_pesapal_txn_id_key" ON "AffiliatePayoutRecord"("pesapal_txn_id");

-- CreateIndex
CREATE INDEX "AffiliatePayoutRecord_affiliate_user_id_idx" ON "AffiliatePayoutRecord"("affiliate_user_id");

-- CreateIndex
CREATE INDEX "AffiliatePayoutRecord_status_idx" ON "AffiliatePayoutRecord"("status");

-- AddForeignKey
ALTER TABLE "AffiliateRelationship" ADD CONSTRAINT "AffiliateRelationship_shop_user_id_fkey" FOREIGN KEY ("shop_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateRelationship" ADD CONSTRAINT "AffiliateRelationship_affiliate_user_id_fkey" FOREIGN KEY ("affiliate_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProductGrant" ADD CONSTRAINT "AffiliateProductGrant_relationship_id_fkey" FOREIGN KEY ("relationship_id") REFERENCES "AffiliateRelationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProductGrant" ADD CONSTRAINT "AffiliateProductGrant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliatePayoutRecord" ADD CONSTRAINT "AffiliatePayoutRecord_affiliate_user_id_fkey" FOREIGN KEY ("affiliate_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
