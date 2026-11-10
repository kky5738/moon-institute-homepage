import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { getHomeIntroductionPage } from "@/lib/home-introduction";
import { parsePageParam } from "@/lib/pagination";
import { Pagination } from "@/components/site/Pagination";
import { HomeIntroductionForm } from "./HomeIntroductionForm";
import { HomeIntroductionList } from "./HomeIntroductionList";

export const metadata: Metadata = { title: "첫 화면 관리" };
// Node and browser ICU data can produce different labels for the same locale.
const dateFormatter = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" });

export default async function HomeIntroductionAdminPage({ searchParams }: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  await requireAdmin();
  const { contents, currentContentId, page, totalPages, totalItems } = await getHomeIntroductionPage(parsePageParam((await searchParams).page));

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8">
      <div className="border-b border-border pb-8">
        <p className="text-sm font-semibold text-primary">관리자</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">첫 화면 관리</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">이미지와 짧은 문구를 한 묶음으로 등록합니다. PC·모바일 배치를 미리 확인해주세요.</p>
      </div>
      <HomeIntroductionForm />
      <section aria-labelledby="saved-content-title" className="mt-12 border-t border-border pt-8">
        <h2 id="saved-content-title" className="text-xl font-semibold">보관 콘텐츠 <span className="text-sm font-normal text-muted">총 {totalItems}개</span></h2>
        <HomeIntroductionList
          currentContentId={currentContentId}
          contents={contents.map((content) => ({
            ...content, createdAt: content.createdAt.toISOString(), lastAppliedAt: content.lastAppliedAt?.toISOString() ?? null,
            createdAtLabel: dateFormatter.format(content.createdAt), lastAppliedAtLabel: content.lastAppliedAt ? dateFormatter.format(content.lastAppliedAt) : null,
          }))}
        />
        <Pagination basePath="/admin/home-introduction" page={page} totalPages={totalPages} />
      </section>
    </div>
  );
}
