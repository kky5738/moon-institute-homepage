import type { Metadata } from "next";
import { connection } from "next/server";
import { MaterialArchiveCard } from "@/components/materials/MaterialArchiveCard";
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
        <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-10 lg:py-20">
          <div>
            <p className="text-sm font-semibold text-primary">홍보자료</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              읽는 순서가 있는 자료 아카이브
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
              공개 자료가 등록되면 자료 이용 순서와 해설 요약을 함께 확인하는
              아카이브로 제공합니다.
            </p>
          </div>
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
              등록된 홍보자료가 없습니다.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
