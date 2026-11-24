import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { lifeRecordId, LifeRecordValidationError } from "@/lib/life-record-validation";
import { validateHomeIntroductionInput } from "@/lib/home-introduction-validation";
import { createHomeIntroductionDisplay } from "@/lib/home-introduction-image";
import { createResearchUploadTicket, downloadHomeIntroductionImage, downloadHomeIntroductionDisplay, uploadHomeIntroductionDisplay, removeResearchObjects } from "@/lib/supabase-storage";
import { logServerError } from "@/lib/server-log";

export type LifeImageInput = { recordId: string; name: string; contentType: string; size: number };
const displayPath = (id: string) => `life-events/display/${id}.webp`;

export async function prepareLifeImage(adminId: string, input: LifeImageInput) {
  const recordId = lifeRecordId(input.recordId);
  const { contentType, size, extension } = validateHomeIntroductionInput({ ...input, message: "사건 사진", altText: "사건 사진" });
  if (typeof input.name !== "string" || !input.name.trim() || input.name.length > 255) throw new LifeRecordValidationError("사진 파일명을 확인해주세요.");
  if (!await prisma.lifeRecord.findUnique({ where: { id: recordId }, select: { id: true } })) throw new LifeRecordValidationError("먼저 사건을 저장해주세요.");
  const id = randomUUID();
  const objectPath = `life-events/original/${recordId}/${id}.${extension}`;
  await prisma.lifeRecordImage.create({ data: { id, recordId, adminId, objectPath, contentType, size, originalName: input.name } });
  try { return { id, ...await createResearchUploadTicket(objectPath) }; }
  catch (error) { await discardLifeImage(adminId, id); throw error; }
}

export async function completeLifeImage(adminId: string, rawId: string) {
  const id = lifeRecordId(rawId);
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM life_record_images WHERE id = ${id}::uuid FOR UPDATE`;
      const image = await tx.lifeRecordImage.findUnique({ where: { id } });
      if (!image || image.adminId !== adminId) throw new LifeRecordValidationError("등록할 사진을 찾을 수 없습니다.");
      if (!image.uploadedAt) {
        const bytes = await downloadHomeIntroductionImage(image.objectPath, image);
        const display = await createHomeIntroductionDisplay(bytes, image.contentType);
        await uploadHomeIntroductionDisplay(displayPath(id), display.bytes);
        await tx.lifeRecordImage.update({ where: { id }, data: {
          uploadedAt: new Date(), displaySize: display.displaySize,
          imageWidth: display.displayWidth, imageHeight: display.displayHeight,
        } });
      }
      return { id, originalName: image.originalName };
    }, { timeout: 60_000 });
  } catch (error) {
    try { await discardLifeImage(adminId, id); }
    catch { logServerError("life-images.cleanup", new Error("미완료 사진 정리에 실패했습니다.")); }
    throw error;
  }
}

export async function discardLifeImage(adminId: string, rawId: string) {
  const id = lifeRecordId(rawId);
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM life_record_images WHERE id = ${id}::uuid FOR UPDATE`;
    const image = await tx.lifeRecordImage.findUnique({ where: { id } });
    if (!image || image.adminId !== adminId || image.uploadedAt) return;
    await removeResearchObjects([image.objectPath, displayPath(id)]);
    await tx.lifeRecordImage.delete({ where: { id } });
  }, { timeout: 60_000 });
}

// Public requests always recheck publication and the selected cover; no signed URL escapes.
export async function lifeImageResponse(rawId: string, admin = false) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  let id: string;
  try { id = lifeRecordId(rawId); } catch { return new Response(null, { status: 404, headers }); }
  try {
    const image = await prisma.lifeRecordImage.findFirst({ where: {
      id, uploadedAt: { not: null }, ...(admin ? {} : { covers: { some: { status: "PUBLISHED" } } }),
    } });
    if (!image?.displaySize) return new Response(null, { status: 404, headers });
    const bytes = await downloadHomeIntroductionDisplay(displayPath(id), { size: image.displaySize, contentType: "image/webp" });
    return new Response(new Uint8Array(bytes), { headers: { ...headers, "Content-Type": "image/webp" } });
  } catch {
    logServerError("life-images.read", new Error("사건 사진을 제공하지 못했습니다."));
    return new Response(null, { status: 503, headers });
  }
}
