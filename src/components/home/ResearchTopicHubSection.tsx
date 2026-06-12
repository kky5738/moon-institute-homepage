import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { researchTopics } from "@/lib/topics";

export function ResearchTopicHubSection() {
  return (
    <section id="topics" className="scroll-mt-16 border-b border-border bg-secondary/55 py-12 sm:py-16 lg:py-16">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-purple">
              Topic Hub
            </span>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-foreground [word-break:keep-all] sm:text-4xl lg:text-4xl">
              관심 주제에서 자료와 공지로 이어집니다
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              주제 상세 페이지에서 관련 공지, 자료, 영상 안내, 문의 경로를
              한 화면으로 연결합니다.
            </p>
          </div>
          <Link
            href="/topics"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "w-fit hover:bg-background",
            })}
          >
            전체 주제 보기
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:gap-5">
          {researchTopics.map((topic, index) => (
            <Card
              key={topic.slug}
              className="group flex min-h-[18rem] flex-col rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all hover:border-accent-purple/50 hover:shadow-[var(--shadow-elegant)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge>{topic.focusLabel}</Badge>
                  <h3 className="mt-4 text-xl font-semibold leading-snug text-foreground [word-break:keep-all] transition-colors group-hover:text-primary sm:text-2xl">
                    {topic.title}
                  </h3>
                </div>
                <span className="shrink-0 text-sm font-semibold text-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {topic.summary}
              </p>

              <div className="mt-auto pt-6">
                <Link
                  href={topic.primaryLink.href}
                  className={buttonVariants({
                    size: "lg",
                    className: "w-full",
                  })}
                >
                  {topic.primaryLink.label}
                  <span className="ml-2" aria-hidden="true">→</span>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
