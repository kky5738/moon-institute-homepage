import "server-only";

import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { inspectHomeIntroductionImage } from "@/lib/home-introduction-image";
import { validateHomeIntroductionId, validateHomeIntroductionInput, type HomeIntroductionInput } from "@/lib/home-introduction-validation";
import { createResearchUploadTicket, downloadHomeIntroductionImage, removeResearchObjects } from "@/lib/supabase-storage";
import { logServerError } from "@/lib/server-log";

async function lockUpload(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT id FROM home_introduction_uploads WHERE id = ${id}::uuid FOR UPDATE`;
}

export async function prepareHomeIntroductionUpload(adminId: string, input: HomeIntroductionInput) {
  const { extension, ...data } = validateHomeIntroductionInput(input);
  const id = randomUUID();
  const objectPath = `home-introduction/${id}.${extension}`;
  await prisma.homeIntroductionUpload.create({ data: { id, adminId, objectPath, ...data } });
  try {
    const ticket = await createResearchUploadTicket(objectPath);
    return { id, ...ticket };
  } catch (error) {
    await discardHomeIntroductionUpload(adminId, id);
    throw error;
  }
}

export async function completeHomeIntroductionUpload(adminId: string, rawId: string) {
  const id = validateHomeIntroductionId(rawId);
  try {
    return await prisma.$transaction(async (tx) => {
      await lockUpload(tx, id);
      // A repeated completion must never remove a successfully registered image.
      if (await tx.homeIntroductionContent.findUnique({ where: { id } })) return { id };
      const upload = await tx.homeIntroductionUpload.findUnique({ where: { id } });
      if (!upload || upload.adminId !== adminId) throw new Error("확인할 업로드를 찾을 수 없습니다.");
      const { contentType, size, message, altText } = validateHomeIntroductionInput(upload);
      const bytes = await downloadHomeIntroductionImage(upload.objectPath, { contentType, size });
      const dimensions = await inspectHomeIntroductionImage(bytes, contentType);
      await tx.homeIntroductionContent.create({ data: {
        id, objectPath: upload.objectPath, contentType, size, message, altText, ...dimensions,
      } });
      await tx.homeIntroductionUpload.delete({ where: { id } });
      return { id };
    }, { timeout: 60_000 });
  } catch (error) {
    try { await discardHomeIntroductionUpload(adminId, id); }
    catch (cleanupError) { logServerError("home-introduction.upload.cleanup", cleanupError); }
    throw error;
  }
}

export async function discardHomeIntroductionUpload(adminId: string, rawId: string) {
  const id = validateHomeIntroductionId(rawId);
  await prisma.$transaction(async (tx) => {
    await lockUpload(tx, id);
    if (await tx.homeIntroductionContent.findUnique({ where: { id } })) return;
    const upload = await tx.homeIntroductionUpload.findUnique({ where: { id } });
    if (!upload || upload.adminId !== adminId) return;
    // Keep the ticket if removal fails, so a later discard can retry this exact object.
    await removeResearchObjects([upload.objectPath]);
    await tx.homeIntroductionUpload.delete({ where: { id } });
  }, { timeout: 60_000 });
}
