import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MaterialGuide } from "@/lib/material-guides";
import type { BoardPost } from "@/lib/posts";

export function MaterialArchiveCard({ post, guide }: { post: BoardPost; guide: MaterialGuide | null }) {

  return (
    <Card className="group flex min-h-[22rem] flex-col p-5 transition-all hover:border-accent-purple/50 hover:shadow-[var(--shadow-elegant)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {guide && <><Badge>{guide.stepLabel}</Badge>
          <Badge variant="gold">
            읽기 {String(guide.readingOrder).padStart(2, "0")}
          </Badge></>}
        </div>
        {post.isPinned ? (
          <Badge variant="secondary" className="shrink-0">고정</Badge>
        ) : null}
      </div>

      <p className="mt-5 text-xs font-semibold tracking-wider text-muted-foreground">
        {post.category} / {post.publishedAt}
      </p>
      <h2 className="mt-3 text-xl font-semibold leading-snug text-foreground [word-break:keep-all] transition-colors group-hover:text-primary sm:text-2xl">
        <Link href={`/materials/${post.slug}`}>
          {post.title}
        </Link>
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {post.summary}
      </p>

      {guide && <div className="mt-5 rounded-lg border border-border bg-secondary/45 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-purple">
          Reading Guide
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {guide.archiveSummary}
        </p>
      </div>}

      <div className="mt-auto flex flex-col gap-2 pt-6 min-[420px]:flex-row">
        <Link
          href={`/materials/${post.slug}`}
          className={buttonVariants({
            size: "lg",
            className: "flex-1",
          })}
        >
          {guide ? "해설과 함께 보기" : "자료 보기"}
          <span className="ml-2" aria-hidden="true">→</span>
        </Link>
        {guide && <Link
          href={guide.topicHref}
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          관련 주제
        </Link>}
      </div>
    </Card>
  );
}
