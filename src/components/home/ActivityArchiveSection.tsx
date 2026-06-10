import Link from "next/link";
import { activityItems, resourceNoticeItems } from "@/lib/site-content";

type ArchiveCategory = "활동" | "자료" | "공지";

const archiveItems = [
  ...activityItems.map((item) => ({
    category: "활동" as ArchiveCategory,
    title: item.title,
    summary: item.description,
    href: item.href,
    meta: item.linkLabel,
  })),
  ...resourceNoticeItems.map((item) => ({
    category: item.type as ArchiveCategory,
    title: item.title,
    summary: item.description,
    href: item.href,
    meta: item.type,
  })),
];

const categoryClassName: Record<ArchiveCategory, string> = {
  활동: "bg-primary/10 text-primary-dark",
  자료: "bg-gold/15 text-[color:var(--gold)]",
  공지: "bg-accent-purple/10 text-accent-purple",
};

export function ActivityArchiveSection() {
  return (
    <section id="notice" className="scroll-mt-16 border-y border-border bg-secondary/45 py-12 lg:py-12">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-purple">
              Archive Hub
            </span>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-foreground [word-break:keep-all] sm:text-4xl lg:text-4xl">
              활동, 자료, 공지를 한 곳에서
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              초기에는 단순한 게시판 구조를 유지하면서도 연구소 활동, 자료
              공유, 공지 안내가 서로 연결되도록 설계했습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "전체", href: "/" },
              { label: "활동", href: "/about" },
              { label: "자료", href: "/materials" },
              { label: "공지", href: "/notices" },
            ].map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors",
                  index === 0
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground/70 hover:border-accent-purple/50",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid auto-cols-[minmax(15.5rem,78vw)] grid-flow-col gap-4 overflow-x-auto pb-1 md:grid-flow-row md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3 lg:gap-4">
          {archiveItems.map((item) => (
            <Link
              key={`${item.category}-${item.title}`}
              href={item.href}
              className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-accent-purple/50 hover:shadow-[var(--shadow-soft)] sm:p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryClassName[item.category]}`}>
                  {item.category}
                </span>
                <span className="text-xl leading-none text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary">
                  ↗
                </span>
              </div>
              <p className="mt-4 text-xs font-semibold tracking-wider text-muted-foreground">
                {item.meta}
              </p>
              <h3 className="mt-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-xl">
                {item.title}
              </h3>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground md:line-clamp-3">
                {item.summary}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
