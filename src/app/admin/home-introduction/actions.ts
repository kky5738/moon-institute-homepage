"use server";

import { assertAdmin } from "@/lib/admin-auth";
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

function uploadError(error: unknown) {
  logServerError("admin.home-introduction.upload", error);
  const message = error instanceof Error && /[가-힣]/.test(error.message) && !("code" in error) && !error.cause
    ? error.message : "이미지를 등록하지 못했습니다. 다시 시도해주세요.";
  return { ok: false as const, message };
}
