-- CreateTable
CREATE TABLE "home_introduction_contents" (
    "id" UUID NOT NULL,
    "objectPath" TEXT,
    "localAsset" TEXT,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "imageWidth" INTEGER NOT NULL,
    "imageHeight" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAppliedAt" TIMESTAMP(3),

    CONSTRAINT "home_introduction_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_introduction_settings" (
    "id" TEXT NOT NULL DEFAULT 'home-introduction',
    "currentContentId" UUID NOT NULL,

    CONSTRAINT "home_introduction_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_introduction_uploads" (
    "id" UUID NOT NULL,
    "adminId" TEXT NOT NULL,
    "objectPath" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "home_introduction_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "home_introduction_contents_objectPath_key" ON "home_introduction_contents"("objectPath");

-- CreateIndex
CREATE UNIQUE INDEX "home_introduction_contents_localAsset_key" ON "home_introduction_contents"("localAsset");

-- CreateIndex
CREATE INDEX "home_introduction_contents_createdAt_id_idx" ON "home_introduction_contents"("createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "home_introduction_uploads_objectPath_key" ON "home_introduction_uploads"("objectPath");

-- AddForeignKey
ALTER TABLE "home_introduction_settings" ADD CONSTRAINT "home_introduction_settings_currentContentId_fkey" FOREIGN KEY ("currentContentId") REFERENCES "home_introduction_contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A singleton pointer cannot select pending uploads; they have no content row.
ALTER TABLE "home_introduction_settings" ADD CONSTRAINT "home_introduction_singleton"
CHECK ("id" = 'home-introduction');
ALTER TABLE "home_introduction_contents" ADD CONSTRAINT "home_introduction_valid_content" CHECK (
  (("objectPath" IS NOT NULL AND "localAsset" IS NULL AND "objectPath" LIKE 'home-introduction/%') OR
   ("objectPath" IS NULL AND "localAsset" IS NOT NULL AND "localAsset" = 'home-introduction.jpeg'))
  AND "contentType" IN ('image/jpeg', 'image/png', 'image/webp')
  AND "size" BETWEEN 1 AND 20971520
  AND "imageWidth" BETWEEN 1 AND 20000 AND "imageHeight" BETWEEN 1 AND 20000
  AND "imageWidth"::bigint * "imageHeight" <= 40000000
  AND length(trim("message")) BETWEEN 1 AND 200
  AND length(trim("altText")) BETWEEN 1 AND 200
);

-- Snapshot the existing local asset and original user-provided copy. No sample-data seed needed.
INSERT INTO "home_introduction_contents"
  ("id", "localAsset", "contentType", "size", "imageWidth", "imageHeight", "message", "altText", "lastAppliedAt")
VALUES ('00000000-0000-4000-8000-000000000060', 'home-introduction.jpeg', 'image/jpeg',
  1351980, 1507, 1848, '문선명 선생 그는...', '눈을 감고 생각에 잠긴 문선명 선생의 모습', CURRENT_TIMESTAMP);
INSERT INTO "home_introduction_settings" ("id", "currentContentId")
VALUES ('home-introduction', '00000000-0000-4000-8000-000000000060');

DO $security$
DECLARE target_role TEXT; target_table TEXT;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['home_introduction_contents', 'home_introduction_settings', 'home_introduction_uploads'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', target_table);
    FOR target_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated') LOOP
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE %I FROM %I', target_table, target_role);
    END LOOP;
  END LOOP;
END
$security$;
