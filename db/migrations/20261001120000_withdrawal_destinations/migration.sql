-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bank_account_name" TEXT,
ADD COLUMN     "bank_account_number" TEXT,
ADD COLUMN     "bank_details_updated_at" TIMESTAMP(3),
ADD COLUMN     "bank_name" TEXT;

-- AlterTable
ALTER TABLE "WithdrawalOtp" ADD COLUMN     "purpose" TEXT NOT NULL DEFAULT 'WITHDRAWAL';

-- AlterTable
ALTER TABLE "ClientWithdrawal" ADD COLUMN     "payout_bank_account_name" TEXT,
ADD COLUMN     "payout_bank_account_number" TEXT,
ADD COLUMN     "payout_bank_name" TEXT,
ADD COLUMN     "payout_method" TEXT NOT NULL DEFAULT 'MOBILE_MONEY',
ADD COLUMN     "payout_phone" TEXT;

