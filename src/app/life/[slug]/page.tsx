import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LifeRecordDocument } from "@/components/life/LifeRecordDocument";
import { getPublishedLifeRecord } from "@/lib/life-records";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const record = await getPublishedLifeRecord((await params).slug);
  return { title: record?.title ?? "생애 기록", description: record?.summary };
}
export default async function LifeDetailPage({ params }: Props) {
  const record = await getPublishedLifeRecord((await params).slug);
  if (!record) notFound();
  return <LifeRecordDocument record={record} />;
}
