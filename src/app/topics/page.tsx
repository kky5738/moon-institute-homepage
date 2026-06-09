import type { Metadata } from "next";
import Link from "next/link";
import { TopicIndexCard } from "@/components/topics/TopicIndexCard";
import { researchTopics } from "@/lib/topics";

export const metadata: Metadata = {
  title: "연구 주제",
  description: "문선명 연구소의 연구 주제별 자료와 공지 탐색 경로입니다.",
};

export default function TopicsPage() {
  return (
    <div className="bg-background">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold text-primary">연구 주제</p>
          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
                주제에서 자료, 공지, 문의로 이어집니다
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
                초기에는 별도 주제 모델을 만들지 않고, 운영 방향에 맞춘 mock
                주제와 기존 게시글 카테고리를 느슨하게 연결합니다.
              </p>
            </div>
            <div className="border-t border-primary pt-5 text-sm leading-6 text-muted lg:mb-1">
              게시글이 아직 없거나 카테고리 연결이 충분하지 않아도 각 주제
              페이지에서 다음 탐색 경로와 문의 CTA를 확인할 수 있습니다.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {researchTopics.map((topic, index) => (
            <TopicIndexCard key={topic.slug} topic={topic} index={index} />
          ))}
        </div>

        <div className="mt-8 border border-border bg-surface p-5 shadow-sm shadow-primary-dark/5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                전체 게시판으로 보기
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                주제 흐름과 별개로 기존 공지사항과 홍보자료 목록도 그대로
                유지합니다.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:min-w-72">
              <Link
                href="/notices"
                className="inline-flex min-h-11 items-center justify-center border border-border px-4 py-2 text-sm font-semibold text-primary hover:border-primary hover:bg-[#f1eef8] hover:text-primary-dark"
              >
                공지사항
              </Link>
              <Link
                href="/materials"
                className="inline-flex min-h-11 items-center justify-center border border-border px-4 py-2 text-sm font-semibold text-primary hover:border-primary hover:bg-[#f1eef8] hover:text-primary-dark"
              >
                홍보자료
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
