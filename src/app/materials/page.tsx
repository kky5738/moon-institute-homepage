import type { Metadata } from "next";
import Link from "next/link";
import { MaterialArchiveCard } from "@/components/materials/MaterialArchiveCard";
import { Pagination } from "@/components/site/Pagination";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PostType } from "@/generated/prisma/enums";
import { getMaterialGuide } from "@/lib/material-guides";
import { parsePageParam } from "@/lib/pagination";
import { getPublishedPostPage } from "@/lib/posts";

export const metadata: Metadata = {
  title: "홍보자료",
  description: "문선명 연구소 관련 홍보자료 목록입니다.",
};

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const requestedPage = parsePageParam((await searchParams).page);
  const {
    posts: materials,
    page,
    totalPages,
  } = await getPublishedPostPage(PostType.PROMOTION, requestedPage);

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-10 lg:py-20">
          <div>
            <p className="text-sm font-semibold text-primary">홍보자료</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              홍보자료 아카이브
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
              공개 자료와 선별된 자료의 해설을 함께 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 lg:px-10 lg:py-16">
        {materials.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {materials.map((post) => (
              <MaterialArchiveCard key={post.id} post={post} guide={getMaterialGuide(post.slug)} />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden p-0 shadow-[var(--shadow-soft)]">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
              <div className="px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-purple">
                  Material Archive
                </p>
                <h2 className="mt-4 max-w-2xl text-2xl font-semibold leading-tight text-foreground [word-break:keep-all] sm:text-3xl">
                  등록된 홍보자료가 없습니다
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                  연구 주제 페이지에서 주요 관심 영역을 확인하거나 필요한
                  자료와 참여 문의를 남겨주세요.
                </p>

                <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row">
                  <Link
                    href="/topics"
                    className={buttonVariants({
                      size: "lg",
                      className: "w-full min-[420px]:w-auto",
                    })}
                  >
                    연구 주제 보기
                    <span className="ml-2" aria-hidden="true">→</span>
                  </Link>
                  <Link
                    href="/contact"
                    className={buttonVariants({
                      variant: "outline",
                      size: "lg",
                      className: "w-full min-[420px]:w-auto",
                    })}
                  >
                    문의/참여 신청
                  </Link>
                </div>
              </div>

              <div className="border-t border-border bg-secondary/55 px-5 py-7 sm:px-8 lg:border-l lg:border-t-0 lg:px-8 lg:py-10">
                <h3 className="text-base font-semibold text-primary-dark">
                  이용 안내
                </h3>
                <dl className="mt-5 space-y-5 text-sm leading-6 text-muted-foreground">
                  <div>
                    <dt className="font-semibold text-foreground">
                      공개 기준
                    </dt>
                    <dd className="mt-1">
                      공개된 홍보자료를 제공하며, 일부 자료에는 해설이 함께 제공됩니다.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">
                      탐색 경로
                    </dt>
                    <dd className="mt-1">
                      일부 자료는 연구 주제와 자료 해설에 연결됩니다.
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </Card>
        )}
      </section>
      <Pagination basePath="/materials" page={page} totalPages={totalPages} />
    </div>
  );
}
