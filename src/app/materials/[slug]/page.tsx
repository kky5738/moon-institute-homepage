import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostDocument } from "@/components/posts/PostDocument";
import styles from "@/components/posts/post-surface.module.css";
import { RecommendedMaterialList } from "@/components/materials/RecommendedMaterialList";
import { PostType } from "@/generated/prisma/enums";
import { homeDiscoveryEnabled } from "@/lib/home-discovery";
import {
  getMaterialGuide,
  getRecommendedMaterialPosts,
} from "@/lib/material-guides";
import {
  getPublishedPostBySlug,
  getPublishedPostMetadataBySlug,
  getPublishedPostPreview,
} from "@/lib/posts";

type MaterialDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: MaterialDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostMetadataBySlug(PostType.PROMOTION, slug);

  return {
    title: post?.title ?? "홍보자료",
    description: post?.summary ?? "문선명 연구소 홍보자료입니다.",
  };
}

export default async function MaterialDetailPage({
  params,
}: MaterialDetailPageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(PostType.PROMOTION, slug);

  if (!post) {
    notFound();
  }

  const guide = getMaterialGuide(post.slug);

  const materials = guide ? await getPublishedPostPreview(PostType.PROMOTION, {
    slugs: guide.recommendationSlugs,
    take: 3,
  }) : [];
  const recommendedMaterials = getRecommendedMaterialPosts(post.slug, materials);

  return (
    <PostDocument post={post} backHref="/materials" backLabel="홍보자료"
      supplement={guide ? (
        <>
          <section className={styles.supplement} aria-labelledby="material-commentary-title">
            <p className="text-xs text-muted">{guide.stepLabel} · 읽기 {String(guide.readingOrder).padStart(2, "0")}</p>
            <h2 id="material-commentary-title">자료 해설</h2>
            <h3>해설 요약</h3>
            <p>{guide.explanationSummary}</p>
            <h3>읽기 포인트</h3>
            <ul className="list-decimal space-y-3 pl-5">
              {guide.readingPoints.map((point) => <li key={point}>{point}</li>)}
            </ul>
            <h3>{guide.topicLabel}</h3>
            <Link href={guide.topicHref} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">관련 주제 보기</Link>
          </section>
          <RecommendedMaterialList posts={recommendedMaterials} />
          <section className={styles.supplement} aria-labelledby="video-guide-title">
            <h2 id="video-guide-title">{guide.videoGuide.title}</h2>
            <p className="text-sm text-muted">{guide.videoGuide.description}</p>
            {(homeDiscoveryEnabled || guide.videoGuide.href !== "/#media") && (
              <Link href={guide.videoGuide.href} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">영상 콘텐츠 보기</Link>
            )}
          </section>
        </>
      ) : undefined}>
      <section aria-label="자료 본문">
        {guide && <h2 className="mb-5 text-base font-semibold">자료 본문</h2>}
        <div className="whitespace-pre-wrap break-words">{post.content}</div>
      </section>
    </PostDocument>
  );
}
