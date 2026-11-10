import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { HomeIntroductionForm } from "./HomeIntroductionForm";

export const metadata: Metadata = { title: "첫 화면 관리" };

export default async function HomeIntroductionAdminPage() {
  await requireAdmin();
  const contents = await prisma.homeIntroductionContent.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 10,
    select: { id: true, message: true, altText: true, imageWidth: true, imageHeight: true, createdAt: true },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8">
      <div className="border-b border-border pb-8">
        <p className="text-sm font-semibold text-primary">관리자</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">첫 화면 관리</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">이미지와 짧은 문구를 한 묶음으로 등록합니다. PC·모바일 배치를 미리 확인해주세요.</p>
      </div>
      <HomeIntroductionForm />
      <section aria-labelledby="saved-content-title" className="mt-12 border-t border-border pt-8">
        <h2 id="saved-content-title" className="text-xl font-semibold">최근 등록 콘텐츠</h2>
        <p className="mt-2 text-sm text-muted">최근 10개를 표시합니다. 등록된 이미지와 문구는 한 묶음으로 보관됩니다.</p>
        <ul className="mt-5 divide-y divide-border border-y border-border">
          {contents.map((content) => (
            <li key={content.id} className="py-5">
              <p className="whitespace-pre-wrap font-semibold [overflow-wrap:anywhere]">{content.message}</p>
              <p className="mt-2 text-sm text-muted [overflow-wrap:anywhere]">이미지 설명: {content.altText}</p>
              <p className="mt-2 text-xs text-muted">{content.imageWidth} × {content.imageHeight}px · 등록일 {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(content.createdAt)}</p>
            </li>
          ))}
        </ul>
        {!contents.length ? <p className="py-6 text-sm text-muted">등록된 콘텐츠가 없습니다.</p> : null}
      </section>
    </div>
  );
}
