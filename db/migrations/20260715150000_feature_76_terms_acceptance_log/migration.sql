-- CreateTable
CREATE TABLE "TermsAcceptance" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "terms_version" TEXT NOT NULL,
    "ip_address" TEXT,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermsAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TermsAcceptance_user_id_idx" ON "TermsAcceptance"("user_id");

-- AddForeignKey
ALTER TABLE "TermsAcceptance" ADD CONSTRAINT "TermsAcceptance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
