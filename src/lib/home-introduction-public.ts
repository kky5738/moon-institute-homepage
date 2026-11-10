import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { homeIntroduction } from "@/lib/site-content";
import { HOME_INTRODUCTION_CACHE_TAG } from "@/lib/home-introduction";
import { DEFAULT_HOME_INTRODUCTION_ID, validateStoredHomeIntroduction } from "@/lib/home-introduction-validation";
import { logServerError } from "@/lib/server-log";

const defaultContent = {
  id: DEFAULT_HOME_INTRODUCTION_ID,
  image: homeIntroduction.image,
  imageWidth: homeIntroduction.image.width,
  imageHeight: homeIntroduction.image.height,
  message: homeIntroduction.message,
  altText: homeIntroduction.alt,
};

// Image access must check the pointer on every request, outside the homepage cache.
export async function readCurrentHomeIntroduction() {
  const settings = await prisma.homeIntroductionSettings.findUnique({
    where: { id: "home-introduction" }, select: { currentContent: true },
  });
  const content = settings?.currentContent ?? null;
  if (content) validateStoredHomeIntroduction(content);
  return content;
}

async function getCachedHomeIntroduction() {
  "use cache";
  cacheLife("minutes");
  cacheTag(HOME_INTRODUCTION_CACHE_TAG);
  const content = await readCurrentHomeIntroduction();
  if (!content) throw new Error("현재 콘텐츠가 없습니다.");
  return {
    id: content.id,
    image: content.objectPath ? `/home-introduction/${content.id}/image` : homeIntroduction.image,
    imageWidth: content.imageWidth,
    imageHeight: content.imageHeight,
    message: content.message,
    altText: content.altText,
  };
}

export async function getPublicHomeIntroduction() {
  try {
    return await getCachedHomeIntroduction();
  } catch (error) {
    unstable_rethrow(error);
    // Database and Storage errors can contain credentials or private paths.
    logServerError("home-introduction.read", new Error("현재 콘텐츠 조회에 실패해 기본 콘텐츠를 표시합니다."));
    return defaultContent;
  }
}
