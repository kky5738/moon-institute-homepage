import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Pagination } from "@/components/site/Pagination";
import { InquiryStatus, InquiryType } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getPostPageWindow,
  parsePageParam,
  POSTS_PER_PAGE,
} from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { updateInquiryStatus } from "./actions";

export const metadata: Metadata = {
  title: "문의 관리",
  description: "문의, 참여 신청, 후원 관심 접수 목록을 확인합니다.",
};

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  await connection();
  await requireAdmin();
  const requestedPage = parsePageParam((await searchParams).page);
  const { inquiries, page, totalPages } =
    await getAdminInquiryPage(requestedPage);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8">
      <div className="border-b border-border pb-8">
        <p className="text-sm font-semibold text-primary">관리자</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          문의 관리
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          공개 문의 폼으로 접수된 일반 문의, 참여 신청, 후원 관심 목록입니다.
          삭제하지 않고 상태 변경으로 보존합니다.
        </p>
      </div>

      <section className="mt-8 divide-y divide-border border-y border-border bg-surface">
        {inquiries.length > 0 ? (
          inquiries.map((inquiry) => (
            <article
              key={inquiry.id}
              className="grid gap-5 px-5 py-5 md:grid-cols-[150px_1fr_260px] md:px-6"
            >
              <div className="space-y-2 text-sm text-muted">
                <p className="font-semibold text-foreground">
                  {getInquiryTypeLabel(inquiry.type)}
                </p>
                <p>{formatDate(inquiry.createdAt)}</p>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    {inquiry.subject ?? "제목 없음"}
                  </h2>
                  <span className="border border-border px-2 py-1 text-xs font-semibold text-muted">
                    {getStatusLabel(inquiry.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">
                  접수자: {inquiry.name}
                </p>
              </div>

              <div className="flex flex-wrap items-start gap-2 md:justify-end">
                <Link
                  href={`/admin/inquiries/${inquiry.id}`}
                  className="inline-flex min-h-8 items-center border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary-dark hover:border-primary hover:text-foreground"
                >
                  상세 보기
                </Link>
                {inquiry.status !== InquiryStatus.REVIEWED ? (
                  <StatusButton id={inquiry.id} status={InquiryStatus.REVIEWED}>
                    검토 완료
                  </StatusButton>
                ) : null}
                {inquiry.status !== InquiryStatus.ARCHIVED ? (
                  <StatusButton id={inquiry.id} status={InquiryStatus.ARCHIVED}>
                    보관
                  </StatusButton>
                ) : null}
                {inquiry.status !== InquiryStatus.NEW ? (
                  <StatusButton id={inquiry.id} status={InquiryStatus.NEW}>
                    새 문의로
                  </StatusButton>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <div className="px-5 py-10 text-sm text-muted md:px-6">
            접수된 문의가 없습니다.
          </div>
        )}
      </section>
      <Pagination
        basePath="/admin/inquiries"
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}

async function getAdminInquiryPage(requestedPage: number) {
  try {
    const totalItems = await prisma.inquiry.count();
    const pagination = getPostPageWindow(requestedPage, totalItems);
    const inquiries = await prisma.inquiry.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        subject: true,
        createdAt: true,
      },
      orderBy: [
        { status: "asc" },
        { createdAt: "desc" },
        { id: "desc" },
      ],
      skip: pagination.offset,
      take: POSTS_PER_PAGE,
    });

    return { ...pagination, inquiries };
  } catch (error) {
    logServerError("admin.inquiries.list", error);
    throw error;
  }
}

function StatusButton({
  id,
  status,
  children,
}: {
  id: number;
  status: InquiryStatus;
  children: React.ReactNode;
}) {
  return (
    <form action={updateInquiryStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary-dark hover:border-primary hover:text-foreground"
      >
        {children}
      </button>
    </form>
  );
}

function getInquiryTypeLabel(type: InquiryType) {
  if (type === InquiryType.GENERAL) {
    return "일반 문의";
  }

  if (type === InquiryType.PARTICIPATION) {
    return "참여 신청";
  }

  return "후원 관심";
}

function getStatusLabel(status: InquiryStatus) {
  if (status === InquiryStatus.NEW) {
    return "새 문의";
  }

  if (status === InquiryStatus.REVIEWED) {
    return "검토 완료";
  }

  return "보관";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}
