ALTER TABLE "home_introduction_contents"
  ADD COLUMN "displayObjectPath" TEXT,
  ADD COLUMN "displayContentType" TEXT,
  ADD COLUMN "displaySize" INTEGER,
  ADD COLUMN "displayWidth" INTEGER,
  ADD COLUMN "displayHeight" INTEGER;
CREATE UNIQUE INDEX "home_introduction_contents_displayObjectPath_key" ON "home_introduction_contents"("displayObjectPath");
ALTER TABLE "home_introduction_contents" ADD CONSTRAINT "home_introduction_display_complete" CHECK (
  num_nonnulls("displayObjectPath", "displayContentType", "displaySize", "displayWidth", "displayHeight") = 0
  OR (
    num_nonnulls("displayObjectPath", "displayContentType", "displaySize", "displayWidth", "displayHeight") = 5
    AND "objectPath" IS NOT NULL
    AND "displayObjectPath" = 'home-introduction/' || id::text || '-display.webp'
    AND "displayContentType" = 'image/webp'
    AND "displaySize" BETWEEN 1 AND 20971520
    AND "displayWidth" BETWEEN 1 AND LEAST(1920, "imageWidth")
    AND "displayHeight" BETWEEN 1 AND LEAST(1920, "imageHeight")
  )
);
