import Link from "next/link";
import type { BoardPost } from "@/lib/posts";

export function TopicPostList({
  title,
  description,
  posts,
  listHref,
  listLabel,
  emptyMessage,
  postBasePath,
}: {
  title: string;
  description: string;
  posts: BoardPost[];
  listHref: string;
  listLabel: string;
  emptyMessage: string;
  postBasePath: "/notices" | "/materials";
}) {
  return (
    <section className="border border-border bg-surface shadow-sm shadow-primary-dark/5">
      <div className="border-b border-border p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {description}
            </p>
          </div>
          <Link
            href={listHref}
            className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline"
          >
            {listLabel}
          </Link>
        </div>
      </div>

      {posts.length > 0 ? (
        <div className="divide-y divide-border">
          {posts.map((post) => (
            <article key={post.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>{post.publishedAt}</span>
                <span className="border border-border px-2 py-1 font-semibold text-primary">
                  {post.category}
                </span>
                {post.isPinned ? (
                  <span className="border border-border bg-[#f1eef8] px-2 py-1 font-semibold text-primary-dark">
                    고정
                  </span>
                ) : null}
                <span>{post.phase}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-foreground">
                <Link
                  href={`${postBasePath}/${post.slug}`}
                  className="hover:text-primary hover:underline"
                >
                  {post.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {post.summary}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          <p className="border border-dashed border-border bg-background px-4 py-6 text-sm leading-6 text-muted">
            {emptyMessage}
          </p>
        </div>
      )}
    </section>
  );
}
