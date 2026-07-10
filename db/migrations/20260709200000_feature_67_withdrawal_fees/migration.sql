-- AlterTable
ALTER TABLE "WalletWithdrawal" ADD COLUMN "processor_fee_amount" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN "net_amount" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ClientWithdrawal" ADD COLUMN "platform_fee_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "processor_fee_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "net_amount" INTEGER NOT NULL DEFAULT 0;
