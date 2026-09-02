import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { InquiryStatus, InquiryType } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";

export const metadata: Metadata = {
  title: "문의 상세",
  description: "접수된 문의의 연락처와 내용을 확인합니다.",
};

export default async function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  await requireAdmin();
  const id = Number((await params).id);

  if (!Number.isInteger(id) || id < 1) notFound();

  let inquiry;

  try {
    inquiry = await prisma.inquiry.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        type: true,
        status: true,
        subject: true,
        message: true,
        createdAt: true,
      },
    });
  } catch (error) {
    logServerError("admin.inquiries.detail", error);
    throw error;
  }

  if (!inquiry) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 lg:px-8">
      <Link
        href="/admin/inquiries"
        className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline"
      >
        문의 목록
      </Link>

      <article className="mt-6 border-y border-border bg-surface px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="border border-border px-2 py-1 text-xs font-semibold text-muted">
            {getInquiryTypeLabel(inquiry.type)}
          </span>
          <span className="border border-border px-2 py-1 text-xs font-semibold text-muted">
            {getStatusLabel(inquiry.status)}
          </span>
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground">
          {inquiry.subject ?? "제목 없음"}
        </h1>

        <dl className="mt-6 grid gap-4 border-y border-border py-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-foreground">접수자</dt>
            <dd className="mt-1 text-muted">{inquiry.name}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">접수 시각</dt>
            <dd className="mt-1 text-muted">{formatDate(inquiry.createdAt)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">이메일</dt>
            <dd className="mt-1 text-muted">
              {inquiry.email ? (
                <a className="break-all hover:text-foreground" href={`mailto:${inquiry.email}`}>
                  {inquiry.email}
                </a>
              ) : (
                "없음"
              )}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">연락처</dt>
            <dd className="mt-1 text-muted">
              {inquiry.phone ? (
                <a className="break-all hover:text-foreground" href={`tel:${inquiry.phone}`}>
                  {inquiry.phone}
                </a>
              ) : (
                "없음"
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-7">
          <h2 className="text-sm font-semibold text-foreground">문의 내용</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">
            {inquiry.message}
          </p>
        </div>
      </article>
    </div>
  );
}

function getInquiryTypeLabel(type: InquiryType) {
  if (type === InquiryType.GENERAL) return "일반 문의";
  if (type === InquiryType.PARTICIPATION) return "참여 신청";
  return "후원 관심";
}

function getStatusLabel(status: InquiryStatus) {
  if (status === InquiryStatus.NEW) return "새 문의";
  if (status === InquiryStatus.REVIEWED) return "검토 완료";
  return "보관";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}
