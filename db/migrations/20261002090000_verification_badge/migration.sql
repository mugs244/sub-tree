-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verified_at" TIMESTAMP(3),
ADD COLUMN     "verified_name" TEXT;

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AWAITING_CAPTURE',
    "smile_user_id" TEXT NOT NULL,
    "smile_job_id" TEXT,
    "smile_result" TEXT,
    "result_summary" TEXT,
    "id_full_name" TEXT,
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationRequest_smile_user_id_key" ON "VerificationRequest"("smile_user_id");

-- CreateIndex
CREATE INDEX "VerificationRequest_user_id_idx" ON "VerificationRequest"("user_id");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_idx" ON "VerificationRequest"("status");

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

