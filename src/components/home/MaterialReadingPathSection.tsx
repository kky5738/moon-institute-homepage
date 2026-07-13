import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { MaterialArchiveItem } from "@/lib/material-guides";

export function MaterialReadingPathSection({
  items,
}: {
  items: MaterialArchiveItem[];
}) {
  return (
    <section id="materials" className="scroll-mt-16 border-y border-border bg-secondary/45 py-12 lg:py-16">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 sm:px-6 lg:grid-cols-[minmax(16rem,0.75fr)_minmax(0,1.5fr)] lg:gap-12 lg:px-10">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-purple">
            Reading Path
          </span>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-foreground [word-break:keep-all] sm:text-4xl">
            처음 읽을 자료부터 차례로
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            공개된 입문 자료를 읽는 순서대로 살펴보고, 각 자료의 해설과 다음
            읽을 자료로 이어갈 수 있습니다.
          </p>
          <Link
            href="/materials"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "mt-6 w-fit bg-background",
            })}
          >
            전체 자료 보기
          </Link>
        </div>

        {items.length > 0 ? (
          <ol className="divide-y divide-border border-y border-border bg-card">
            {items.map(({ guide, post }, index) => (
              <li
                key={post.id}
                className="grid gap-4 px-4 py-5 sm:px-6 sm:py-6 md:grid-cols-[3rem_minmax(0,1fr)_auto] md:items-start"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{guide.stepLabel}</Badge>
                    <Link
                      href={guide.topicHref}
                      className="text-xs font-semibold text-primary-dark hover:text-primary hover:underline"
                    >
                      {guide.topicLabel} 주제
                    </Link>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground [word-break:keep-all] sm:text-xl">
                    <Link
                      href={`/materials/${post.slug}`}
                      className="hover:text-primary hover:underline"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {guide.archiveSummary}
                  </p>
                </div>
                <Link
                  href={`/materials/${post.slug}`}
                  className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline md:mt-1 md:whitespace-nowrap"
                >
                  해설 보기 <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <div className="border border-dashed border-border bg-card px-5 py-10 sm:px-8 sm:py-12">
            <h3 className="text-xl font-semibold text-foreground">
              처음 읽을 공개 자료를 준비하고 있습니다
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              자료가 공개되기 전에는 연구 주제에서 관심 영역을 살펴볼 수
              있습니다. 공개 자료가 등록되면 이곳에 읽기 순서가 표시됩니다.
            </p>
            <Link
              href="/topics"
              className={buttonVariants({ className: "mt-6" })}
            >
              연구 주제 보기
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
