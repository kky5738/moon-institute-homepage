import Link from "next/link";
import type { ReactNode } from "react";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import {
  activityItems,
  participationItems,
  resourceNoticeItems,
  videoContentItems,
} from "@/lib/site-content";
import { researchTopics } from "@/lib/topics";

const sectionShellClassName =
  "mx-auto w-full max-w-screen-2xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20 xl:px-10 xl:py-24 2xl:px-12";

export function HomeLandingSections() {
  return (
    <div className="overflow-hidden bg-background">
      <HomeHeroSection />
      <ResearchTopicHubSection />
      <VideoSection />
      <ActivityResourceNoticeSection />
      <ParticipationCtaSection />
    </div>
  );
}

function ResearchTopicHubSection() {
  return (
    <section
      aria-labelledby="research-topic-hub-heading"
      className="border-b border-border bg-background"
    >
      <SectionShell>
        <SectionHeading
          titleId="research-topic-hub-heading"
          eyebrow="연구 주제 허브"
          title="관심 주제에서 자료와 공지로 이어집니다"
          description="주제 상세 페이지에서 관련 공지, 자료, 영상 안내, 문의 경로를 한 화면으로 연결합니다."
        />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
          {researchTopics.map((topic, index) => (
            <ResearchTopicCard
              key={topic.slug}
              index={index}
              topic={topic}
            />
          ))}
        </div>
      </SectionShell>
    </section>
  );
}

function ResearchTopicCard({
  index,
  topic,
}: {
  index: number;
  topic: (typeof researchTopics)[number];
}) {
  return (
    <article className="flex min-h-[18rem] flex-col border border-border bg-surface p-5 shadow-sm shadow-primary-dark/5 sm:p-6 xl:min-h-[21rem] xl:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-accent">
            {topic.focusLabel}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-foreground">
            {topic.title}
          </h3>
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
          href={topic.primaryLink.href}
          className="inline-flex min-h-11 w-full items-center justify-center bg-primary-dark px-4 py-2 text-center text-sm font-semibold text-white hover:bg-primary"
        >
          {topic.primaryLink.label}
        </Link>
        <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
          {topic.secondaryLinks.map((link) => (
            <Link
              key={`${topic.title}-${link.label}`}
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

function VideoSection() {
  return (
    <section id="video-content" className="border-b border-border bg-[#f1eef8]">
      <SectionShell>
        <SectionHeading
          eyebrow="영상 콘텐츠"
          title="소개와 해설을 영상 콘텐츠로 확장합니다"
          description="영상 공개 전에는 준비 상태를 명확히 보여주고, 공개 후에는 소개 영상과 자료 해설을 빠르게 찾을 수 있도록 구성합니다."
        />

        <div className="grid gap-5 md:grid-cols-3 xl:gap-6">
          {videoContentItems.map((item, index) => (
            <article key={item.title} className="flex flex-col border border-border bg-surface shadow-sm shadow-primary-dark/5">
              <div className="relative aspect-video overflow-hidden border-b border-border bg-primary-dark">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#352556,#4C3A7A_55%,#6D5CA5)] opacity-90" />
                <div className="absolute left-5 top-5 rounded-full border border-white/60 px-3 py-1 text-xs font-semibold text-white">
                  {item.meta}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-white/15 text-white">
                    <span className="ml-1 text-2xl" aria-hidden="true">
                      ▶
                    </span>
                  </div>
                </div>
                <p className="absolute bottom-4 right-5 text-xs font-semibold text-white">
                  {String(index + 1).padStart(2, "0")} / {item.length}
                </p>
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6 xl:p-7">
                <h3 className="text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </SectionShell>
    </section>
  );
}

function ActivityResourceNoticeSection() {
  return (
    <section className="border-b border-border bg-background">
      <SectionShell>
        <SectionHeading
          eyebrow="활동, 자료, 공지"
          title="방문자가 필요한 경로를 바로 찾도록 정리합니다"
          description="초기에는 단순한 게시판 구조를 유지하면서도 연구소 활동, 자료 공유, 공지 안내가 서로 연결되도록 설계했습니다."
        />

        <div className="grid gap-5 md:grid-cols-3 xl:gap-6">
          {activityItems.map((item) => (
            <article key={item.title} className="flex flex-col border border-border bg-surface p-5 shadow-sm shadow-primary-dark/5 sm:p-6 md:min-h-[14rem] xl:p-7">
              <h3 className="text-xl font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-muted">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="mt-6 inline-flex text-sm font-semibold text-primary hover:text-primary-dark hover:underline md:mt-auto md:pt-6"
              >
                {item.linkLabel}
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-6 border border-border bg-surface shadow-sm shadow-primary-dark/5 xl:mt-8">
          <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
            {resourceNoticeItems.map((item) => (
              <Link key={item.title} href={item.href} className="block p-5 hover:bg-[#f1eef8] sm:p-6 md:min-h-[12rem] xl:p-7">
                <p className="text-xs font-semibold text-primary">{item.type}</p>
                <h3 className="mt-3 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </SectionShell>
    </section>
  );
}

function ParticipationCtaSection() {
  return (
    <section className="bg-primary-dark text-white">
      <SectionShell className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:items-center xl:gap-12">
        <div>
          <p className="text-sm font-semibold text-[#d8d0ee]">참여와 문의</p>
          <h2 className="mt-4 max-w-5xl text-3xl font-semibold leading-tight [word-break:keep-all] sm:text-4xl 2xl:text-5xl">
            문의, 참여 신청, 후원 관심을 한곳에서 접수합니다
          </h2>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-[#e6e0f3] sm:text-base sm:leading-7">
            남겨주신 내용은 관리자 확인을 거쳐 연구소 운영과 향후 안내를 위한
            기록으로 관리합니다.
          </p>
        </div>

        <div className="border border-white/20 bg-white/[0.08] p-5 sm:p-6 xl:p-7">
          <ul className="grid gap-3 text-sm text-[#e6e0f3] sm:grid-cols-3 lg:grid-cols-1">
            {participationItems.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-2 w-2 bg-accent" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/contact"
            className="mt-6 inline-flex h-11 w-full items-center justify-center border border-white bg-white px-5 text-sm font-semibold text-primary-dark hover:bg-[#ede9f7]"
          >
            문의/참여 신청
          </Link>
        </div>
      </SectionShell>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  titleId,
  description,
}: {
  eyebrow: string;
  title: string;
  titleId?: string;
  description: string;
}) {
  return (
    <div className="mb-8 max-w-6xl sm:mb-10 lg:mb-12">
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h2
        id={titleId}
        className="mt-3 text-2xl font-semibold leading-tight text-foreground [word-break:keep-all] sm:text-4xl 2xl:text-5xl"
      >
        {title}
      </h2>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
        {description}
      </p>
    </div>
  );
}

function SectionShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={[sectionShellClassName, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
