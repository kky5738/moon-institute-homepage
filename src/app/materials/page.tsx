import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { MaterialArchiveCard } from "@/components/materials/MaterialArchiveCard";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PostType } from "@/generated/prisma/enums";
import { getMaterialArchiveItems } from "@/lib/material-guides";
import { getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "홍보자료",
  description: "문선명 연구소 관련 홍보자료 목록입니다.",
};

export default async function MaterialsPage() {
  await connection();
  const materials = await getPublishedPosts(PostType.PROMOTION);
  const archiveItems = getMaterialArchiveItems(materials);

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:items-end lg:px-10 lg:py-20">
          <div>
            <p className="text-sm font-semibold text-primary">홍보자료</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              읽는 순서가 있는 자료 아카이브
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
              소개 자료와 안내 자료를 단순 최신순 목록이 아니라 자료 이용
              순서와 해설 요약을 함께 확인하는 아카이브로 제공합니다.
            </p>
          </div>

          <Card className="bg-secondary/55 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-purple">
              Archive Note
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              운영자가 관리하기 쉬운 읽기 순서와 단계 안내를 중심으로
              자료를 정리합니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/topics"
                className={buttonVariants({
                  variant: "outline",
                  className: "hover:bg-background",
                })}
              >
                주제 허브
              </Link>
              <Link
                href="/topics/life"
                className={buttonVariants({
                  variant: "outline",
                  className: "hover:bg-background",
                })}
              >
                생애
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 lg:px-10 lg:py-16">
        {archiveItems.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {archiveItems.map((item) => (
              <MaterialArchiveCard key={item.post.id} item={item} />
            ))}
          </div>
        ) : (
          <Card className="px-5 py-10">
            <p className="text-sm leading-6 text-muted-foreground">
              등록된 홍보자료가 없습니다. 자료가 공개되면 읽기 순서와 해설
              요약이 함께 표시됩니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/topics"
                className={buttonVariants()}
              >
                연구 주제 보기
              </Link>
              <Link
                href="/contact"
                className={buttonVariants({ variant: "outline" })}
              >
                문의하기
              </Link>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
