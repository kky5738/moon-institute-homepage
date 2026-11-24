import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getPostPageWindow, POSTS_PER_PAGE } from "@/lib/pagination";
import { LIFE_RECORD_CACHE_TAG, MAX_HOME_LIFE_RECORDS, LifeRecordValidationError, type LifeRecordFields, type parseLifeRecordSearch } from "@/lib/life-record-validation";
import { isPrismaMissingTableError } from "@/lib/server-log";

export const lifeRecordCardSelect = {
  id: true, slug: true, title: true, year: true, dateLabel: true, summary: true, imageAlt: true,
  coverImage: { select: { id: true, imageWidth: true, imageHeight: true } },
} satisfies Prisma.LifeRecordSelect;

export type LifeRecordCardData = Prisma.LifeRecordGetPayload<{ select: typeof lifeRecordCardSelect }>;

export function lifeRecordWhere(search: ReturnType<typeof parseLifeRecordSearch>, publicOnly = true): Prisma.LifeRecordWhereInput {
  return {
    ...(publicOnly ? { status: "PUBLISHED" } : {}),
    ...(search.year ? { year: search.year } : {}),
    ...(search.q ? { OR: [
      { title: { contains: search.q, mode: "insensitive" } },
      { summary: { contains: search.q, mode: "insensitive" } },
      { content: { contains: search.q, mode: "insensitive" } },
    ] } : {}),
  };
}

export async function getLifeHighlights() {
  "use cache";
  cacheLife("minutes");
  cacheTag(LIFE_RECORD_CACHE_TAG);
  try {
    return await prisma.lifeRecord.findMany({
      where: { status: "PUBLISHED", featured: true }, select: lifeRecordCardSelect,
      orderBy: [{ sortOrder: "asc" }, { year: "asc" }, { id: "asc" }], take: MAX_HOME_LIFE_RECORDS,
    });
  } catch (error) {
    // Allow deployment before the separate, explicitly authorized database rollout.
    if (isPrismaMissingTableError(error)) return [];
    throw error;
  }
}

export async function getLifeRecordPage(requestedPage: number, search: ReturnType<typeof parseLifeRecordSearch>) {
  "use cache";
  cacheLife("minutes");
  cacheTag(LIFE_RECORD_CACHE_TAG);
  const where = lifeRecordWhere(search);
  try {
    const pagination = getPostPageWindow(requestedPage, await prisma.lifeRecord.count({ where }));
    const records = await prisma.lifeRecord.findMany({
      where, select: { id: true, slug: true, title: true, year: true, summary: true },
      orderBy: [{ year: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
      skip: pagination.offset, take: POSTS_PER_PAGE,
    });
    return { ...pagination, records };
  } catch (error) {
    if (isPrismaMissingTableError(error)) return { ...getPostPageWindow(1, 0), records: [] };
    throw error;
  }
}

export async function getPublishedLifeRecord(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(LIFE_RECORD_CACHE_TAG);
  if (slug.length > 160) return null;
  try {
    return await prisma.lifeRecord.findFirst({
      where: { slug, status: "PUBLISHED" }, select: { ...lifeRecordCardSelect, content: true, source: true },
    });
  } catch (error) {
    if (isPrismaMissingTableError(error)) return null;
    throw error;
  }
}

// Called only after assertAdmin. Serialize edits to avoid exceeding the home limit.
export async function saveLifeRecord(data: LifeRecordFields, options: { id: string; slug?: string; updatedAt?: string }) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(690023)::text`;
    if (options.updatedAt) {
      const current = await tx.lifeRecord.findUnique({ where: { id: options.id } });
      if (!current || current.updatedAt.toISOString() !== options.updatedAt) {
        throw new LifeRecordValidationError("다른 화면에서 변경된 사건입니다. 입력 내용을 복사한 뒤 새로고침해주세요.");
      }
    }
    if (data.coverImageId) {
      const image = await tx.lifeRecordImage.findFirst({ where: { id: data.coverImageId, recordId: options.id, uploadedAt: { not: null } } });
      if (!image) throw new LifeRecordValidationError("이 사건에 등록한 사진을 선택해주세요.");
    }
    if (data.status === "PUBLISHED" && data.featured) {
      const count = await tx.lifeRecord.count({ where: { status: "PUBLISHED", featured: true, id: { not: options.id } } });
      if (count >= MAX_HOME_LIFE_RECORDS) throw new LifeRecordValidationError(`홈에는 최대 ${MAX_HOME_LIFE_RECORDS}건을 소개할 수 있습니다. 다른 사건의 홈 노출을 해제해주세요.`);
    }
    return options.slug
      ? tx.lifeRecord.create({ data: { ...data, id: options.id, slug: options.slug } })
      : tx.lifeRecord.update({ where: { id: options.id }, data });
  });
}
