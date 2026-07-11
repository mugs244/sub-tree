-- CreateTable
CREATE TABLE "DonationLaunchSubscriber" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "user_id" INTEGER,
    "notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationLaunchSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DonationLaunchSubscriber_email_key" ON "DonationLaunchSubscriber"("email");

-- CreateIndex
CREATE INDEX "DonationLaunchSubscriber_notified_at_idx" ON "DonationLaunchSubscriber"("notified_at");

-- AddForeignKey
ALTER TABLE "DonationLaunchSubscriber" ADD CONSTRAINT "DonationLaunchSubscriber_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
