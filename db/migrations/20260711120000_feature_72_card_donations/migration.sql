-- AlterEnum
ALTER TYPE "MomoProvider" ADD VALUE 'CARD';

-- AlterTable
ALTER TABLE "Donation" ALTER COLUMN "donor_phone" DROP NOT NULL;
