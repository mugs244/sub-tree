-- CreateTable
CREATE TABLE "VerificationSubscription" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'MONTHLY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "auto_renew_wallet" BOOLEAN NOT NULL DEFAULT false,
    "card_recurring" BOOLEAN NOT NULL DEFAULT false,
    "reminded_7_for" TIMESTAMP(3),
    "reminded_1_for" TIMESTAMP(3),
    "lapsed_notified_for" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'VERIFICATION',
    "plan" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "due_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "payment_method" TEXT,
    "merchant_reference" TEXT NOT NULL,
    "pesapal_tracking_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationSubscription_user_id_key" ON "VerificationSubscription"("user_id");

-- CreateIndex
CREATE INDEX "VerificationSubscription_current_period_end_idx" ON "VerificationSubscription"("current_period_end");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_merchant_reference_key" ON "Invoice"("merchant_reference");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_pesapal_tracking_id_key" ON "Invoice"("pesapal_tracking_id");

-- CreateIndex
CREATE INDEX "Invoice_user_id_idx" ON "Invoice"("user_id");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- AddForeignKey
ALTER TABLE "VerificationSubscription" ADD CONSTRAINT "VerificationSubscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

