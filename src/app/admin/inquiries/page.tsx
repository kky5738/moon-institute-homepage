import type { Metadata } from "next";
import { connection } from "next/server";
import { InquiryStatus, InquiryType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { updateInquiryStatus } from "./actions";

export const metadata: Metadata = {
  title: "문의 관리",
  description: "문의, 참여 신청, 후원 관심 접수 목록을 확인합니다.",
};

export default async function AdminInquiriesPage() {
  await connection();

  let inquiries;

  try {
    inquiries = await prisma.inquiry.findMany({
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
      orderBy: [
        { status: "asc" },
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });
  } catch (error) {
    logServerError("admin.inquiries.list", error);
    throw error;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8">
      <div className="border-b border-neutral-200 pb-8">
        <p className="text-sm font-semibold text-stone-700">관리자</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950">
          문의 관리
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
          공개 문의 폼으로 접수된 일반 문의, 참여 신청, 후원 관심 목록입니다.
          삭제하지 않고 상태 변경으로 보존합니다.
        </p>
      </div>

      <section className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200 bg-white">
        {inquiries.length > 0 ? (
          inquiries.map((inquiry) => (
            <article
              key={inquiry.id}
              className="grid gap-5 px-5 py-5 md:grid-cols-[150px_1fr_210px] md:px-6"
            >
              <div className="space-y-2 text-sm text-neutral-500">
                <p className="font-semibold text-neutral-900">
                  {getInquiryTypeLabel(inquiry.type)}
                </p>
                <p>{formatDate(inquiry.createdAt)}</p>
                <ContactDetails email={inquiry.email} phone={inquiry.phone} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-neutral-950">
                    {inquiry.subject ?? "제목 없음"}
                  </h2>
                  <span className="border border-neutral-200 px-2 py-1 text-xs font-semibold text-neutral-600">
                    {getStatusLabel(inquiry.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-500">
                  접수자: {inquiry.name}
                </p>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-600">
                  {inquiry.message}
                </p>
              </div>

              <div className="flex flex-wrap items-start gap-2 md:justify-end">
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
          <div className="px-5 py-10 text-sm text-neutral-500 md:px-6">
            접수된 문의가 없습니다.
          </div>
        )}
      </section>
    </div>
  );
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
        className="border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-neutral-950 hover:text-neutral-950"
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

function ContactDetails({
  email,
  phone,
}: {
  email: string | null;
  phone: string | null;
}) {
  if (!email && !phone) {
    return <p>연락처 없음</p>;
  }

  return (
    <dl className="space-y-1">
      {email ? (
        <div>
          <dt className="sr-only">이메일</dt>
          <dd>
            <a className="break-all hover:text-neutral-950" href={`mailto:${email}`}>
              {email}
            </a>
          </dd>
        </div>
      ) : null}
      {phone ? (
        <div>
          <dt className="sr-only">연락처</dt>
          <dd>
            <a className="break-all hover:text-neutral-950" href={`tel:${phone}`}>
              {phone}
            </a>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}
