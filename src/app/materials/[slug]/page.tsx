import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { RecommendedMaterialList } from "@/components/materials/RecommendedMaterialList";
import { PostType } from "@/generated/prisma/enums";
import {
  getMaterialGuide,
  getRecommendedMaterialPosts,
} from "@/lib/material-guides";
import { getPublishedPostBySlug, getPublishedPosts } from "@/lib/posts";

type MaterialDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: MaterialDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(PostType.PROMOTION, slug);

  return {
    title: post?.title ?? "홍보자료",
    description: post?.summary ?? "문선명 연구소 홍보자료입니다.",
  };
}

export default async function MaterialDetailPage({
  params,
}: MaterialDetailPageProps) {
  await connection();
  const { slug } = await params;
  const [post, materials] = await Promise.all([
    getPublishedPostBySlug(PostType.PROMOTION, slug),
    getPublishedPosts(PostType.PROMOTION),
  ]);

  if (!post) {
    notFound();
  }

  const guide = getMaterialGuide(post.slug, post.categorySlug);
  const recommendedMaterials = getRecommendedMaterialPosts(post.slug, materials);

  return (
    <article className="bg-background">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-10 lg:py-20">
          <Link
            href="/materials"
            className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline"
          >
            홍보자료 목록
          </Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-dark">
                  {guide.stepLabel}
                </span>
                <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-[color:var(--gold)]">
                  읽기 {String(guide.readingOrder).padStart(2, "0")}
                </span>
                <span>{post.publishedAt}</span>
                <span>{post.category}</span>
                <span>{post.phase}</span>
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-foreground [word-break:keep-all] sm:text-5xl">
                {post.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
                {post.summary}
              </p>
            </div>

            <aside className="rounded-lg border border-border bg-secondary/55 p-5 shadow-[var(--shadow-soft)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-purple">
                Reading Context
              </p>
              <h2 className="mt-3 text-xl font-semibold text-foreground">
                {guide.topicLabel}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                이 자료는 주제 허브와 연결해 읽을 수 있습니다. 자료의 배경과
                이어서 볼 공개 자료는 주제 상세 페이지와 자료 목록에서 함께
                확인합니다.
              </p>
              <div className="mt-5 grid gap-2">
                <Link
                  href={guide.topicHref}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
                >
                  관련 주제 보기
                </Link>
                <Link
                  href={guide.videoGuide.href}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-primary-dark transition-colors hover:border-accent-purple hover:bg-background"
                >
                  영상 안내
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:px-10 lg:py-16">
        <div className="grid gap-6">
          <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-purple">
              Commentary
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              해설 요약
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              {guide.explanationSummary}
            </p>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-purple">
              Reading Points
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              읽기 포인트
            </h2>
            <ul className="mt-5 grid gap-3">
              {guide.readingPoints.map((point, index) => (
                <li
                  key={point}
                  className="flex gap-3 rounded-lg border border-border bg-secondary/45 p-4 text-sm leading-6 text-muted-foreground"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-purple">
              Original Material
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              자료 본문
            </h2>
            <div className="mt-5 whitespace-pre-line text-base leading-8 text-foreground">
              {post.content}
            </div>
          </section>
        </div>

        <aside className="grid gap-6 lg:self-start">
          <RecommendedMaterialList posts={recommendedMaterials} />

          <section className="rounded-lg border border-border bg-primary-dark p-5 text-white shadow-[var(--shadow-elegant)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
              Video Guide
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              {guide.videoGuide.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {guide.videoGuide.description}
            </p>
            <Link
              href={guide.videoGuide.href}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-primary-dark transition-colors hover:bg-gold"
            >
              영상 콘텐츠 보기
            </Link>
          </section>
        </aside>
      </div>
    </article>
  );
}
