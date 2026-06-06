import Link from "next/link";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import {
  activityItems,
  participationItems,
  researchTopicHubItems,
  resourceNoticeItems,
  videoContentItems,
} from "@/lib/site-content";

export function HomeLandingSections() {
  return (
    <div className="bg-background">
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
    <section className="border-b border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.6fr] lg:items-start">
          <SectionHeading
            eyebrow="연구 주제 허브"
            title="관심 주제에서 자료와 공지로 이어집니다"
            description="초기에는 임시 주제 카드로 탐색 흐름을 검증하고, 이후 주제 상세 페이지와 자료 아카이브로 자연스럽게 확장합니다."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {researchTopicHubItems.map((topic, index) => (
              <article
                key={topic.title}
                className="flex min-h-[18rem] flex-col border border-border bg-surface p-5 shadow-sm shadow-primary-dark/5"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-semibold text-foreground">
                    {topic.title}
                  </h3>
                  <span className="shrink-0 text-xs font-semibold text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted">
                  {topic.description}
                </p>
                <div className="mt-auto pt-6">
                  <div className="grid grid-cols-2 gap-2">
                    {topic.links.map((link) => (
                      <Link
                        key={`${topic.title}-${link.label}`}
                        href={link.href}
                        className="inline-flex min-h-10 items-center justify-center border border-border px-3 py-2 text-center text-sm font-semibold text-primary hover:border-primary hover:bg-[#f1eef8] hover:text-primary-dark"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function VideoSection() {
  return (
    <section id="video-content" className="border-b border-border bg-[#f1eef8]">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:py-16 lg:px-8">
        <SectionHeading
          eyebrow="영상 콘텐츠"
          title="소개와 해설을 영상 콘텐츠로 확장합니다"
          description="영상 공개 전에는 준비 상태를 명확히 보여주고, 공개 후에는 소개 영상과 자료 해설을 빠르게 찾을 수 있도록 구성합니다."
        />

        <div className="grid gap-5 md:grid-cols-3">
          {videoContentItems.map((item, index) => (
            <article key={item.title} className="border border-border bg-surface shadow-sm shadow-primary-dark/5">
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
              <div className="p-5">
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
      </div>
    </section>
  );
}

function ActivityResourceNoticeSection() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:py-16 lg:px-8">
        <SectionHeading
          eyebrow="활동, 자료, 공지"
          title="방문자가 필요한 경로를 바로 찾도록 정리합니다"
          description="초기에는 단순한 게시판 구조를 유지하면서도 연구소 활동, 자료 공유, 공지 안내가 서로 연결되도록 설계했습니다."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {activityItems.map((item) => (
            <article key={item.title} className="border border-border bg-surface p-6 shadow-sm shadow-primary-dark/5">
              <h3 className="text-xl font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-muted">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="mt-6 inline-flex text-sm font-semibold text-primary hover:text-primary-dark hover:underline"
              >
                {item.linkLabel}
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-6 border border-border bg-surface shadow-sm shadow-primary-dark/5">
          <div className="grid divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {resourceNoticeItems.map((item) => (
              <Link key={item.title} href={item.href} className="block p-5 hover:bg-[#f1eef8]">
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
      </div>
    </section>
  );
}

function ParticipationCtaSection() {
  return (
    <section className="bg-primary-dark text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 sm:py-16 lg:grid-cols-[1fr_22rem] lg:items-center lg:px-8">
        <div>
          <p className="text-sm font-semibold text-[#d8d0ee]">참여와 문의</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            문의, 참여 신청, 후원 관심을 한곳에서 접수합니다
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-[#e6e0f3]">
            남겨주신 내용은 관리자 확인을 거쳐 연구소 운영과 향후 안내를 위한
            기록으로 관리합니다.
          </p>
        </div>

        <div className="border border-white/20 bg-white/[0.08] p-5">
          <ul className="grid gap-3 text-sm text-[#e6e0f3]">
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
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}
