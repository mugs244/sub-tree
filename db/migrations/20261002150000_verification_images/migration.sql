-- CreateTable
CREATE TABLE "VerificationImage" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationImage_created_at_idx" ON "VerificationImage"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationImage_request_id_kind_key" ON "VerificationImage"("request_id", "kind");

-- AddForeignKey
ALTER TABLE "VerificationImage" ADD CONSTRAINT "VerificationImage_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "VerificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

