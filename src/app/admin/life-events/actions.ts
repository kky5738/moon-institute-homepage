"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { assertAdmin, AdminUnauthorizedError } from "@/lib/admin-auth";
import { createPostSlug } from "@/lib/post-slug";
import { saveLifeRecord } from "@/lib/life-records";
import { LIFE_RECORD_CACHE_TAG, lifeRecordId, LifeRecordValidationError, parseLifeRecordForm } from "@/lib/life-record-validation";
import { prepareLifeImage, completeLifeImage, discardLifeImage, type LifeImageInput } from "@/lib/life-record-images";
import { logServerError } from "@/lib/server-log";

export type LifeRecordFormState = { message: string; saved?: boolean };

export async function saveLifeRecordAction(_previous: LifeRecordFormState, form: FormData): Promise<LifeRecordFormState> {
  let id: string;
  let slug: string;
  try {
    await assertAdmin();
    const fields = parseLifeRecordForm(form);
    const rawId = form.get("recordId");
    id = rawId ? lifeRecordId(rawId) : randomUUID();
    const updatedAt = form.get("updatedAt");
    if (rawId && (typeof updatedAt !== "string" || !Number.isFinite(Date.parse(updatedAt)))) throw new LifeRecordValidationError("편집 화면을 새로 열어주세요.");
    const record = await saveLifeRecord(fields, {
      id, ...(rawId ? { updatedAt: updatedAt as string } : { slug: createPostSlug(fields.title, id.slice(0, 8)) }),
    });
    slug = record.slug;
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AdminUnauthorizedError) return { message: "로그인이 만료되었습니다. 새 창에서 다시 로그인한 뒤 저장해주세요." };
    if (error instanceof LifeRecordValidationError) return { message: error.message };
    logServerError("admin.life-events.save", new Error("사건 저장에 실패했습니다."));
    return { message: "저장하지 못했습니다. 입력 내용을 유지했으니 다시 시도해주세요." };
  }
  try {
    updateTag(LIFE_RECORD_CACHE_TAG);
    revalidatePath("/");
    revalidatePath("/life");
    revalidatePath(`/life/${slug}`);
    revalidatePath("/admin/life-events", "layout");
  } catch {
    return { saved: true, message: "내용은 저장됐지만 화면 갱신에 실패했습니다. 새로고침 후 저장 내용을 확인해주세요." };
  }
  redirect(`/admin/life-events/${id}/edit?saved=1`);
}

export async function requestLifeImage(input: LifeImageInput) {
  const session = await assertAdmin();
  try { return { ok: true as const, ...await prepareLifeImage(session.user.id, input) }; }
  catch { return { ok: false as const, message: "사진을 등록하지 못했습니다. JPEG·PNG·WebP, 20MB 이하인지 확인해주세요." }; }
}
export async function confirmLifeImage(id: string) {
  const session = await assertAdmin();
  try { return { ok: true as const, ...await completeLifeImage(session.user.id, id) }; }
  catch { return { ok: false as const, message: "사진 검증에 실패했습니다. 손상되지 않은 단일 이미지를 선택해주세요." }; }
}
export async function cancelLifeImage(id: string) {
  const session = await assertAdmin();
  try { await discardLifeImage(session.user.id, id); return { ok: true as const }; }
  catch { return { ok: false as const, message: "미완료 사진 정리를 마치지 못했습니다." }; }
}
