-- AlterTable
ALTER TABLE "Donation" ADD COLUMN "platform_fee" INTEGER,
ADD COLUMN "creator_amount" INTEGER;

-- CreateTable
CREATE TABLE "ClientWithdrawal" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "user_id" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ClientWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientWithdrawal_status_idx" ON "ClientWithdrawal"("status");

-- CreateIndex
CREATE INDEX "ClientWithdrawal_user_id_idx" ON "ClientWithdrawal"("user_id");

-- AddForeignKey
ALTER TABLE "ClientWithdrawal" ADD CONSTRAINT "ClientWithdrawal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
