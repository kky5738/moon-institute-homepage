import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { lifeRecordId } from "@/lib/life-record-validation";
import { lifeRecordCardSelect } from "@/lib/life-records";
import { LifeRecordDocument } from "@/components/life/LifeRecordDocument";
export const metadata: Metadata = { title: "생애 사건 미리보기", robots: { index: false, follow: false } };

export default async function PreviewLifeRecordPage({ params }: { params: Promise<{ id: string }> }) {
  await connection(); await requireAdmin();
  let id: string;
  try { id = lifeRecordId((await params).id); } catch { notFound(); }
  const record = await prisma.lifeRecord.findUnique({ where: { id }, select: { ...lifeRecordCardSelect, content: true, source: true } });
  if (!record) notFound();
  return <LifeRecordDocument record={record} preview />;
}
