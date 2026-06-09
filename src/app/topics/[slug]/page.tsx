import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { TopicPostList } from "@/components/topics/TopicPostList";
import { getTopicRelatedPosts } from "@/lib/topic-posts";
import {
  getResearchTopicBySlug,
  getResearchTopicStaticParams,
} from "@/lib/topics";

type TopicDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getResearchTopicStaticParams();
}

export async function generateMetadata({
  params,
}: TopicDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = getResearchTopicBySlug(slug);

  return {
    title: topic?.title ?? "연구 주제",
    description: topic?.summary ?? "문선명 연구소의 연구 주제 상세 페이지입니다.",
  };
}

export default async function TopicDetailPage({
  params,
}: TopicDetailPageProps) {
  await connection();
  const { slug } = await params;
  const topic = getResearchTopicBySlug(slug);

  if (!topic) {
    notFound();
  }

  const relatedPosts = await getTopicRelatedPosts(topic);

  return (
    <div className="bg-background">
      <article>
        <section className="border-b border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
            <Link
              href="/topics"
              className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline"
            >
              연구 주제 목록
            </Link>
            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start">
              <div>
                <p className="text-sm font-semibold text-accent">
                  {topic.focusLabel}
                </p>
                <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
                  {topic.title}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
                  {topic.description}
                </p>
              </div>
              <aside className="border-t border-primary pt-5">
                <h2 className="text-xl font-semibold text-foreground">
                  연결 경로
                </h2>
                <div className="mt-5 grid gap-2">
                  {topic.secondaryLinks.map((link) => (
                    <Link
                      key={`${topic.slug}-${link.label}`}
                      href={link.href}
                      className="inline-flex min-h-11 items-center justify-center border border-border px-4 py-2 text-sm font-semibold text-primary hover:border-primary hover:bg-[#f1eef8] hover:text-primary-dark"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-12 lg:grid-cols-2 lg:px-8 lg:py-16">
          <TopicPostList
            title="관련 공지"
            description="이 주제와 연결된 공지 카테고리의 공개 게시글입니다."
            posts={relatedPosts.notices}
            listHref="/notices"
            listLabel="공지 전체 보기"
            emptyMessage="아직 이 주제와 연결된 공지사항이 없습니다. 공지 전체 목록 또는 문의 경로를 이용해 주세요."
            postBasePath="/notices"
          />
          <TopicPostList
            title="관련 자료"
            description="이 주제와 연결된 홍보자료 카테고리의 공개 게시글입니다."
            posts={relatedPosts.materials}
            listHref="/materials"
            listLabel="자료 전체 보기"
            emptyMessage="아직 이 주제와 연결된 홍보자료가 없습니다. 자료 전체 목록을 확인하거나 문의를 남길 수 있습니다."
            postBasePath="/materials"
          />
        </section>

        <section className="border-y border-border bg-[#f1eef8]">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:px-8 lg:py-16">
            <div>
              <p className="text-sm font-semibold text-primary">영상 안내</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-foreground">
                {topic.videoGuide.title}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
                {topic.videoGuide.description}
              </p>
            </div>
            <Link
              href={topic.videoGuide.href}
              className="flex min-h-40 flex-col justify-between border border-border bg-surface p-5 shadow-sm shadow-primary-dark/5 hover:border-primary sm:p-6"
            >
              <span className="text-sm font-semibold text-primary">
                영상 콘텐츠
              </span>
              <span className="text-xl font-semibold text-foreground">
                준비 중인 영상 영역 보기
              </span>
            </Link>
          </div>
        </section>

        <section className="bg-primary-dark text-white">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:items-center lg:px-8 lg:py-16">
            <div>
              <p className="text-sm font-semibold text-[#d8d0ee]">
                문의와 참여
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">
                이 주제와 관련해 남길 내용이 있다면 문의로 이어집니다
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[#e6e0f3] sm:text-base sm:leading-7">
                {topic.contactPrompt}
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center border border-white bg-white px-5 text-sm font-semibold text-primary-dark hover:bg-[#ede9f7]"
            >
              문의/참여 신청
            </Link>
          </div>
        </section>
      </article>
    </div>
  );
}
