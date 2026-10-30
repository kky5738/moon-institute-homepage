import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { InquiryEditForm } from "./inquiry-edit-form";

export const metadata: Metadata = { title: "문의 정정" };

export default async function EditInquiryPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) notFound();
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, type: true, subject: true, message: true },
  });
  if (!inquiry) notFound();
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 lg:px-8">
      <h1 className="text-3xl font-semibold text-foreground">문의 정정</h1>
      <p className="mt-4 text-sm text-muted">요청자의 본인 여부를 확인한 뒤 정정해주세요. 처리 완료일은 유지됩니다.</p>
      <InquiryEditForm inquiry={inquiry} />
    </div>
  );
}
