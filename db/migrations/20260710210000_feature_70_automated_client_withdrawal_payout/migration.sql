-- AlterEnum
ALTER TYPE "WithdrawalStatus" ADD VALUE 'PROCESSING';

-- AlterTable
ALTER TABLE "ClientWithdrawal" ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "provider_tx_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ClientWithdrawal_idempotency_key_key" ON "ClientWithdrawal"("idempotency_key");
