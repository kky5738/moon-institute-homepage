-- CreateTable
CREATE TABLE "life_records" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "dateLabel" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT '',
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "coverImageId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "life_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "life_record_images" (
    "id" UUID NOT NULL,
    "recordId" UUID NOT NULL,
    "adminId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "objectPath" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "displaySize" INTEGER,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "uploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "life_record_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "life_records_slug_key" ON "life_records"("slug");

-- CreateIndex
CREATE INDEX "life_records_status_year_sortOrder_id_idx" ON "life_records"("status", "year", "sortOrder", "id");

-- CreateIndex
CREATE INDEX "life_records_status_featured_sortOrder_id_idx" ON "life_records"("status", "featured", "sortOrder", "id");

-- CreateIndex
CREATE UNIQUE INDEX "life_record_images_objectPath_key" ON "life_record_images"("objectPath");

-- CreateIndex
CREATE INDEX "life_record_images_recordId_uploadedAt_idx" ON "life_record_images"("recordId", "uploadedAt");

-- AddForeignKey
ALTER TABLE "life_records" ADD CONSTRAINT "life_records_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "life_record_images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_record_images" ADD CONSTRAINT "life_record_images_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "life_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Only user-provided titles are seeded. Dates, text and photographs require editorial input.
INSERT INTO "life_records" ("id", "slug", "title", "featured", "sortOrder", "updatedAt") VALUES
('00000000-0000-4000-8000-000000000001', 'birth', '탄생', true, 10, CURRENT_TIMESTAMP),
('00000000-0000-4000-8000-000000000002', 'marriage', '결혼(성혼)', true, 20, CURRENT_TIMESTAMP),
('00000000-0000-4000-8000-000000000003', 'seonghwa', '사망(성화)', true, 30, CURRENT_TIMESTAMP);

-- Application records and upload tickets are only accessible through server-side authorization.
DO $security$
DECLARE target_role TEXT; target_table TEXT;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['life_records', 'life_record_images'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', target_table);
    FOR target_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated') LOOP
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE %I FROM %I', target_table, target_role);
    END LOOP;
  END LOOP;
END
$security$;
