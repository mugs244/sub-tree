-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('URL', 'SMART_CARD', 'AFFILIATE', 'FUNDRAISER');

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "link_type" "LinkType" NOT NULL DEFAULT 'URL',
ADD COLUMN     "render_as_plain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smart_card_fetched_at" TIMESTAMP(3),
ADD COLUMN     "smart_card_meta" JSONB;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "hide_branding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "theme_accent_color" TEXT,
ADD COLUMN     "theme_bg_color" TEXT,
ADD COLUMN     "theme_button_color" TEXT,
ADD COLUMN     "theme_button_text" TEXT,
ADD COLUMN     "theme_card_bg" TEXT,
ADD COLUMN     "theme_card_text" TEXT,
ADD COLUMN     "theme_font" TEXT;
