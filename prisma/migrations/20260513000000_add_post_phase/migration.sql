-- CreateEnum
CREATE TYPE "PostPhase" AS ENUM ('PRE_LAUNCH', 'OFFICIAL');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN "phase" "PostPhase" NOT NULL DEFAULT 'PRE_LAUNCH';

-- DropIndex
DROP INDEX "posts_type_status_deletedAt_isPinned_publishedAt_idx";

-- CreateIndex
CREATE INDEX "posts_type_status_phase_deletedAt_isPinned_publishedAt_idx" ON "posts"("type", "status", "phase", "deletedAt", "isPinned", "publishedAt");
