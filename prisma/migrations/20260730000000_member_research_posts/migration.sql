-- AlterEnum
ALTER TYPE "PostType" ADD VALUE 'RESEARCH';

-- DropIndex
DROP INDEX "posts_type_status_phase_deletedAt_isPinned_publishedAt_idx";

-- AlterTable
ALTER TABLE "posts"
ADD COLUMN "authorId" INTEGER,
DROP COLUMN "phase";

-- DropEnum
DROP TYPE "PostPhase";

-- CreateIndex
CREATE INDEX "posts_type_status_deletedAt_isPinned_publishedAt_idx"
ON "posts"("type", "status", "deletedAt", "isPinned", "publishedAt");

-- CreateIndex
CREATE INDEX "posts_authorId_status_updatedAt_idx"
ON "posts"("authorId", "status", "updatedAt");

-- AddForeignKey
ALTER TABLE "posts"
ADD CONSTRAINT "posts_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
