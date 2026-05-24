-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('DIGITAL', 'PHYSICAL');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD_OUT');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('HELD', 'RELEASED', 'DISPUTED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "product_type" "ProductType" NOT NULL,
    "cover_image_url" TEXT,
    "file_url" TEXT,
    "file_size_bytes" BIGINT,
    "shipping_info" TEXT,
    "stock" INTEGER,
    "auto_release_days" INTEGER NOT NULL DEFAULT 7,
    "affiliate_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "affiliate_open" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "seller_user_id" INTEGER NOT NULL,
    "affiliate_user_id" INTEGER,
    "buyer_phone" TEXT NOT NULL,
    "buyer_name" TEXT NOT NULL,
    "buyer_email" TEXT,
    "amount_paid" BIGINT NOT NULL,
    "platform_fee" BIGINT NOT NULL,
    "seller_amount" BIGINT NOT NULL,
    "affiliate_amount" BIGINT,
    "idempotency_key" TEXT NOT NULL,
    "pesapal_txn_id" TEXT,
    "pesapal_provider" TEXT NOT NULL,
    "payment_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "escrow_status" "EscrowStatus" NOT NULL DEFAULT 'HELD',
    "escrow_release_at" TIMESTAMP(3),
    "dispute_raised_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "download_token" TEXT,
    "download_expires_at" TIMESTAMP(3),
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "affiliate_paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_id" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotency_key_key" ON "Order"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "Order_pesapal_txn_id_key" ON "Order"("pesapal_txn_id");

-- CreateIndex
CREATE UNIQUE INDEX "Order_download_token_key" ON "Order"("download_token");

-- CreateIndex
CREATE INDEX "Product_user_id_idx" ON "Product"("user_id");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Order_seller_user_id_idx" ON "Order"("seller_user_id");

-- CreateIndex
CREATE INDEX "Order_affiliate_user_id_idx" ON "Order"("affiliate_user_id");

-- CreateIndex
CREATE INDEX "Order_escrow_status_idx" ON "Order"("escrow_status");

-- CreateIndex
CREATE INDEX "Order_escrow_release_at_idx" ON "Order"("escrow_release_at");

-- CreateIndex
CREATE INDEX "Order_idempotency_key_idx" ON "Order"("idempotency_key");

-- CreateIndex
CREATE INDEX "OrderEvent_order_id_idx" ON "OrderEvent"("order_id");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_affiliate_user_id_fkey" FOREIGN KEY ("affiliate_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
