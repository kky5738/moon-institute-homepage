import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ResearchTopic } from "@/lib/topics";

export function TopicIndexCard({
  topic,
  index,
}: {
  topic: ResearchTopic;
  index: number;
}) {
  return (
    <Card className="flex min-h-[20rem] flex-col rounded-none bg-surface p-5 shadow-sm shadow-primary-dark/5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge variant="accent">{topic.focusLabel}</Badge>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">
            <Link
              href={`/topics/${topic.slug}`}
              className="hover:text-primary hover:underline"
            >
              {topic.title}
            </Link>
          </h2>
        </div>
        <Badge variant="outline" className="shrink-0 rounded-none bg-background">
          {String(index + 1).padStart(2, "0")}
        </Badge>
      </div>

      <p className="mt-5 text-sm leading-6 text-muted">
        {topic.summary}
      </p>

      <div className="mt-auto pt-7">
        <Link
          href={`/topics/${topic.slug}`}
          className={buttonVariants({
            size: "lg",
            className: "w-full rounded-none bg-primary-dark hover:bg-primary",
          })}
        >
          상세 페이지 보기
        </Link>
        <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
          {topic.secondaryLinks.map((link) => (
            <Link
              key={`${topic.slug}-${link.label}`}
              href={link.href}
              className={buttonVariants({
                variant: "outline",
                className: "min-h-10 rounded-none px-2 py-2 text-center",
              })}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}
