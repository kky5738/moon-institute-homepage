import Link from "next/link";
import type { ResearchTopic } from "@/lib/topics";

export function TopicIndexCard({
  topic,
  index,
}: {
  topic: ResearchTopic;
  index: number;
}) {
  return (
    <article className="flex min-h-[20rem] flex-col border border-border bg-surface p-5 shadow-sm shadow-primary-dark/5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-accent">
            {topic.focusLabel}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">
            <Link
              href={`/topics/${topic.slug}`}
              className="hover:text-primary hover:underline"
            >
              {topic.title}
            </Link>
          </h2>
        </div>
        <span className="shrink-0 border border-border bg-background px-2.5 py-1 text-xs font-semibold text-primary">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <p className="mt-5 text-sm leading-6 text-muted">
        {topic.summary}
      </p>

      <div className="mt-auto pt-7">
        <Link
          href={`/topics/${topic.slug}`}
          className="inline-flex min-h-11 w-full items-center justify-center bg-primary-dark px-4 py-2 text-center text-sm font-semibold text-white hover:bg-primary"
        >
          상세 페이지 보기
        </Link>
        <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
          {topic.secondaryLinks.map((link) => (
            <Link
              key={`${topic.slug}-${link.label}`}
              href={link.href}
              className="inline-flex min-h-10 items-center justify-center border border-border px-2 py-2 text-center text-sm font-semibold text-primary hover:border-primary hover:bg-[#f1eef8] hover:text-primary-dark"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
