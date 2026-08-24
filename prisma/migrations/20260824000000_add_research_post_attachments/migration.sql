-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('ATTACHMENT', 'INLINE_IMAGE');

-- CreateTable
CREATE TABLE "post_attachments" (
    "id" UUID NOT NULL,
    "kind" "AttachmentKind" NOT NULL,
    "originalName" TEXT NOT NULL,
    "objectPath" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "altText" TEXT,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "uploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "postId" INTEGER NOT NULL,

    CONSTRAINT "post_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "post_attachments_objectPath_key" ON "post_attachments"("objectPath");

-- CreateIndex
CREATE INDEX "post_attachments_postId_kind_deletedAt_uploadedAt_idx"
ON "post_attachments"("postId", "kind", "deletedAt", "uploadedAt");

-- AddForeignKey
ALTER TABLE "post_attachments"
ADD CONSTRAINT "post_attachments_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "posts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Match the application's server-only Prisma access boundary when Supabase roles exist.
DO $security$
DECLARE
    target_role TEXT;
BEGIN
    FOR target_role IN
        SELECT rolname
        FROM pg_roles
        WHERE rolname IN ('anon', 'authenticated')
    LOOP
        EXECUTE format(
            'REVOKE ALL PRIVILEGES ON TABLE "post_attachments" FROM %I',
            target_role
        );
    END LOOP;
END
$security$;

ALTER TABLE "post_attachments" ENABLE ROW LEVEL SECURITY;
