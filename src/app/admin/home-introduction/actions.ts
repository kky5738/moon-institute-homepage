"use server";

import { assertAdmin } from "@/lib/admin-auth";
import { revalidatePath, updateTag } from "next/cache";
import { applyHomeIntroductionContent, HOME_INTRODUCTION_CACHE_TAG } from "@/lib/home-introduction";
import type { HomeIntroductionInput } from "@/lib/home-introduction-validation";
import { prepareHomeIntroductionUpload, completeHomeIntroductionUpload, discardHomeIntroductionUpload } from "@/lib/home-introduction-uploads";
import { logServerError } from "@/lib/server-log";

export async function requestHomeIntroductionUpload(input: HomeIntroductionInput) {
  const session = await assertAdmin();
  try {
    return { ok: true as const, ...await prepareHomeIntroductionUpload(session.user.id, input) };
  } catch (error) { return uploadError(error); }
}

export async function confirmHomeIntroductionUpload(id: string) {
  const session = await assertAdmin();
  try {
    return { ok: true as const, ...await completeHomeIntroductionUpload(session.user.id, id) };
  } catch (error) { return uploadError(error); }
}

export async function cancelHomeIntroductionUpload(id: string) {
  const session = await assertAdmin();
  try {
    await discardHomeIntroductionUpload(session.user.id, id);
    return { ok: true as const };
  } catch (error) { return uploadError(error); }
}

export type HomeIntroductionApplyResult = {
  status: "success" | "save-error" | "cache-error";
  message: string;
};

export async function applyHomeIntroduction(id: string): Promise<HomeIntroductionApplyResult> {
  await assertAdmin();
  try {
    await applyHomeIntroductionContent(id);
  } catch (error) {
    logServerError("admin.home-introduction.apply", error);
    return { status: "save-error", message: "적용하지 못했습니다. 기존 적용 콘텐츠를 유지합니다. 다시 시도해주세요." };
  }
  return invalidateHomeIntroductionCache();
}

export async function refreshHomeIntroductionCache(): Promise<HomeIntroductionApplyResult> {
  await assertAdmin();
  return invalidateHomeIntroductionCache();
}

function invalidateHomeIntroductionCache(): HomeIntroductionApplyResult {
  try {
    updateTag(HOME_INTRODUCTION_CACHE_TAG);
    revalidatePath("/");
    revalidatePath("/admin/home-introduction");
    return { status: "success", message: "현재 적용 콘텐츠와 화면 정보를 갱신했습니다." };
  } catch (error) {
    logServerError("admin.home-introduction.cache", error);
    return { status: "cache-error", message: "콘텐츠 설정은 저장됐지만 화면 캐시를 갱신하지 못했습니다. 캐시 갱신을 다시 시도해주세요." };
  }
}

function uploadError(error: unknown) {
  logServerError("admin.home-introduction.upload", error);
  const message = error instanceof Error && /[가-힣]/.test(error.message) && !("code" in error) && !error.cause
    ? error.message : "이미지를 등록하지 못했습니다. 다시 시도해주세요.";
  return { ok: false as const, message };
}
