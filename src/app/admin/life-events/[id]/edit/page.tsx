import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { lifeRecordId } from "@/lib/life-record-validation";
import { LifeRecordForm } from "../../LifeRecordForm";
import styles from "@/components/life/life.module.css";

export const metadata: Metadata = { title: "생애 사건 편집", robots: { index: false, follow: false } };

export default async function EditLifeRecordPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }>;
}) {
  await connection(); await requireAdmin();
  let id: string;
  try { id = lifeRecordId((await params).id); } catch { notFound(); }
  const record = await prisma.lifeRecord.findUnique({ where: { id } });
  if (!record) notFound();
  const images = await prisma.lifeRecordImage.findMany({ where: { recordId: id, uploadedAt: { not: null } },
    select: { id: true, originalName: true }, orderBy: { createdAt: "desc" } });
  return <div className={styles.page}><h1>사건 편집</h1>
    {(await searchParams).saved === "1" && <p role="status" className={styles.notice}>저장했습니다. {record.status === "PUBLISHED" ? "공개 화면에 반영되었습니다." : "이 사건은 현재 비공개입니다."}</p>}
    <LifeRecordForm key={record.updatedAt.toISOString()} record={{ ...record, updatedAt: record.updatedAt.toISOString() }} images={images} />
  </div>;
}
