import Link from "next/link";
import type { BoardPost } from "@/lib/posts";

export function RecommendedMaterialList({
  posts,
}: {
  posts: BoardPost[];
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-purple">
            Next Materials
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            이 자료와 함께 볼 자료
          </h2>
        </div>
        <Link
          href="/materials"
          className="text-sm font-semibold text-primary-dark hover:text-primary hover:underline"
        >
          자료 목록
        </Link>
      </div>

      {posts.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/materials/${post.slug}`}
              className="rounded-lg border border-border bg-secondary/45 p-4 transition-colors hover:border-accent-purple hover:bg-secondary"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{post.publishedAt}</span>
                <span className="rounded-full bg-card px-2.5 py-1 font-semibold text-primary-dark">
                  {post.category}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground [word-break:keep-all]">
                {post.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {post.summary}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-border bg-secondary/45 px-4 py-6">
          <p className="text-sm leading-6 text-muted-foreground">
            아직 이어서 볼 공개 자료가 없습니다. 새 자료가 공개되면 이
            영역에서 다음 읽기 경로를 안내합니다.
          </p>
          <Link
            href="/materials"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-primary-dark transition-colors hover:border-accent-purple hover:bg-background"
          >
            자료 목록 보기
          </Link>
        </div>
      )}
    </section>
  );
}
