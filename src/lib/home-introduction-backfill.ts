import "server-only";

import { prisma } from "@/lib/prisma";
import { createHomeIntroductionDisplay } from "@/lib/home-introduction-image";
import { homeIntroductionDisplayPath, validateHomeIntroductionId, validateStoredHomeIntroduction } from "@/lib/home-introduction-validation";
import { downloadHomeIntroductionImage, removeResearchObjects, uploadHomeIntroductionDisplay } from "@/lib/supabase-storage";
import { logServerError } from "@/lib/server-log";

export async function backfillHomeIntroductionDisplay(rawId: string) {
  const id = validateHomeIntroductionId(rawId);
  const displayObjectPath = homeIntroductionDisplayPath(id);
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM home_introduction_contents WHERE id = ${id}::uuid FOR UPDATE`;
      const content = await tx.homeIntroductionContent.findUniqueOrThrow({ where: { id } });
      validateStoredHomeIntroduction(content);
      if (!content.objectPath || content.displayObjectPath) return { id, converted: false };
      const bytes = await downloadHomeIntroductionImage(content.objectPath, content);
      const { bytes: displayBytes, imageWidth, imageHeight, ...display } = await createHomeIntroductionDisplay(bytes, content.contentType);
      if (imageWidth !== content.imageWidth || imageHeight !== content.imageHeight) throw new Error("원본 이미지 치수가 저장된 정보와 다릅니다.");
      // Under the row lock, only an unlinked artifact from a failed attempt can exist here.
      await removeResearchObjects([displayObjectPath]);
      await uploadHomeIntroductionDisplay(displayObjectPath, displayBytes);
      await tx.homeIntroductionContent.update({ where: { id }, data: { displayObjectPath, ...display } });
      return { id, converted: true };
    }, { timeout: 60_000 });
  } catch (error) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM home_introduction_contents WHERE id = ${id}::uuid FOR UPDATE`;
        const content = await tx.homeIntroductionContent.findUnique({ where: { id } });
        // A concurrent retry or an uncertain commit may already have linked this file.
        if (content?.objectPath && !content.displayObjectPath) await removeResearchObjects([displayObjectPath]);
      }, { timeout: 60_000 });
    } catch { logServerError("home-introduction.backfill.cleanup", new Error("표시용 파일 정리를 다시 시도해야 합니다.")); }
    throw error;
  }
}
