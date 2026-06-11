import Link from "next/link";
import type { MaterialArchiveItem } from "@/lib/material-guides";

export function MaterialArchiveCard({ item }: { item: MaterialArchiveItem }) {
  const { guide, post } = item;

  return (
    <article className="group flex min-h-[22rem] flex-col rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all hover:border-accent-purple/50 hover:shadow-[var(--shadow-elegant)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-dark">
            {guide.stepLabel}
          </span>
          <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-[color:var(--gold)]">
            읽기 {String(guide.readingOrder).padStart(2, "0")}
          </span>
        </div>
        {post.isPinned ? (
          <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary-dark">
            고정
          </span>
        ) : null}
      </div>

      <p className="mt-5 text-xs font-semibold tracking-wider text-muted-foreground">
        {post.category} / {post.phase} / {post.publishedAt}
      </p>
      <h2 className="mt-3 text-xl font-semibold leading-snug text-foreground [word-break:keep-all] transition-colors group-hover:text-primary sm:text-2xl">
        <Link href={`/materials/${post.slug}`}>
          {post.title}
        </Link>
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {post.summary}
      </p>

      <div className="mt-5 rounded-lg border border-border bg-secondary/45 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-purple">
          Reading Guide
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {guide.archiveSummary}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-6 min-[420px]:flex-row">
        <Link
          href={`/materials/${post.slug}`}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
        >
          해설과 함께 보기
          <span className="ml-2" aria-hidden="true">→</span>
        </Link>
        <Link
          href={guide.topicHref}
          className="inline-flex h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold text-primary-dark transition-colors hover:border-accent-purple hover:bg-secondary"
        >
          관련 주제
        </Link>
      </div>
    </article>
  );
}
