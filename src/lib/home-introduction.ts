import "server-only";

import { prisma } from "@/lib/prisma";
import { getPostPageWindow, POSTS_PER_PAGE } from "@/lib/pagination";
import { validateHomeIntroductionId, validateStoredHomeIntroduction } from "@/lib/home-introduction-validation";

export const HOME_INTRODUCTION_CACHE_TAG = "home-introduction";

export async function applyHomeIntroductionContent(rawId: string) {
  const id = validateHomeIntroductionId(rawId);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM home_introduction_settings WHERE id = 'home-introduction' FOR UPDATE`;
    const settings = await tx.homeIntroductionSettings.findUnique({ where: { id: "home-introduction" } });
    if (!settings) throw new Error("첫 화면 기본 설정을 찾을 수 없습니다.");
    // Only completed uploads have a content row; pending tickets cannot be selected.
    const content = await tx.homeIntroductionContent.findUnique({ where: { id } });
    if (!content) throw new Error("적용할 콘텐츠를 찾을 수 없습니다.");
    validateStoredHomeIntroduction(content);
    if (settings.currentContentId === id) return;
    await tx.homeIntroductionSettings.update({ where: { id: settings.id }, data: { currentContentId: id } });
    await tx.homeIntroductionContent.update({ where: { id }, data: { lastAppliedAt: new Date() } });
  });
}

export async function getHomeIntroductionPage(requestedPage: number) {
  return prisma.$transaction(async (tx) => {
    const total = await tx.homeIntroductionContent.count();
    const pagination = getPostPageWindow(requestedPage, total);
    const settings = await tx.homeIntroductionSettings.findUniqueOrThrow({ where: { id: "home-introduction" } });
    const contents = await tx.homeIntroductionContent.findMany({
      select: { id: true, localAsset: true, message: true, altText: true, imageWidth: true, imageHeight: true, createdAt: true, lastAppliedAt: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.offset,
      take: POSTS_PER_PAGE,
    });
    return { ...pagination, currentContentId: settings.currentContentId, contents };
  }, { isolationLevel: "RepeatableRead" });
}
