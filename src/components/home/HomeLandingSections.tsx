import Link from "next/link";
import {
  activityItems,
  featuredNewsItems,
  monthlyNewsItems,
  participationItems,
  resourceNoticeItems,
  videoContentItems,
} from "@/lib/site-content";

export function HomeLandingSections() {
  return (
    <div className="bg-stone-50">
      <NewsSection />
      <VideoSection />
      <ActivityResourceNoticeSection />
      <ParticipationCtaSection />
    </div>
  );
}

function NewsSection() {
  const primaryNews = featuredNewsItems[0];
  const supportingNews = featuredNewsItems.slice(1);

  return (
    <section className="border-b border-neutral-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-stone-700">
            문선명 연구소 홈페이지
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-neutral-950 sm:text-5xl">
            주요 소식과 월간 흐름을 차분하게 전합니다
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
            출범 전 홍보 운영부터 공식 홈페이지 전환까지, 공지와 자료를
            보존하는 연구소의 공개 창구로 준비합니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/notices"
              className="inline-flex h-11 items-center justify-center border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              주요 공지 보기
            </Link>
            <Link
              href="/materials"
              className="inline-flex h-11 items-center justify-center border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 hover:border-neutral-500"
            >
              자료 살펴보기
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <article className="border border-neutral-200 bg-stone-50 p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-stone-700">
                {primaryNews.label}
              </p>
              <span className="text-sm font-medium text-neutral-500">
                {primaryNews.date}
              </span>
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-neutral-950">
              {primaryNews.title}
            </h2>
            <p className="mt-4 text-sm leading-6 text-neutral-600">
              {primaryNews.description}
            </p>
            <Link
              href={primaryNews.href}
              className="mt-6 inline-flex text-sm font-semibold text-neutral-950 hover:underline"
            >
              자세히 보기
            </Link>
          </article>

          <div className="grid gap-4 sm:grid-cols-2">
            {supportingNews.map((item) => (
              <article key={item.title} className="border border-neutral-200 bg-white p-5">
                <p className="text-xs font-semibold text-stone-700">
                  {item.label}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-neutral-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>

          <dl className="grid gap-3 border border-neutral-200 bg-white p-5 sm:grid-cols-3">
            {monthlyNewsItems.map((item) => (
              <div key={item.label}>
                <dt className="text-xs font-medium text-neutral-500">
                  {item.label}
                </dt>
                <dd className="mt-2 text-2xl font-semibold text-neutral-950">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function VideoSection() {
  return (
    <section className="border-b border-neutral-200 bg-stone-100">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:py-16 lg:px-8">
        <SectionHeading
          eyebrow="영상 콘텐츠"
          title="소개와 해설을 영상 콘텐츠로 확장합니다"
          description="영상 공개 전에는 준비 상태를 명확히 보여주고, 공개 후에는 소개 영상과 자료 해설을 빠르게 찾을 수 있도록 구성합니다."
        />

        <div className="grid gap-5 md:grid-cols-3">
          {videoContentItems.map((item, index) => (
            <article key={item.title} className="border border-neutral-200 bg-white">
              <div className="relative aspect-video overflow-hidden border-b border-neutral-200 bg-neutral-900">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#1f2937,#44403c_55%,#d6d3d1)] opacity-90" />
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
                <h3 className="text-lg font-semibold text-neutral-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
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
    <section className="border-b border-neutral-200 bg-stone-50">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:py-16 lg:px-8">
        <SectionHeading
          eyebrow="활동, 자료, 공지"
          title="방문자가 필요한 경로를 바로 찾도록 정리합니다"
          description="초기에는 단순한 게시판 구조를 유지하면서도 연구소 활동, 자료 공유, 공지 안내가 서로 연결되도록 설계했습니다."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {activityItems.map((item) => (
            <article key={item.title} className="border border-neutral-200 bg-white p-6">
              <h3 className="text-xl font-semibold text-neutral-950">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-neutral-600">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="mt-6 inline-flex text-sm font-semibold text-neutral-950 hover:underline"
              >
                {item.linkLabel}
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-6 border border-neutral-200 bg-white">
          <div className="grid divide-y divide-neutral-200 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {resourceNoticeItems.map((item) => (
              <Link key={item.title} href={item.href} className="block p-5 hover:bg-stone-50">
                <p className="text-xs font-semibold text-stone-700">{item.type}</p>
                <h3 className="mt-3 text-lg font-semibold text-neutral-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
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
    <section className="bg-neutral-950 text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 sm:py-16 lg:grid-cols-[1fr_22rem] lg:items-center lg:px-8">
        <div>
          <p className="text-sm font-semibold text-stone-300">참여와 문의</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            문의, 참여 신청, 후원 관심을 한곳에서 접수합니다
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-neutral-300">
            남겨주신 내용은 관리자 확인을 거쳐 연구소 운영과 향후 안내를 위한
            기록으로 관리합니다.
          </p>
        </div>

        <div className="border border-white/20 bg-white/5 p-5">
          <ul className="grid gap-3 text-sm text-neutral-200">
            {participationItems.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-2 w-2 bg-stone-300" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/contact"
            className="mt-6 inline-flex h-11 w-full items-center justify-center border border-white bg-white px-5 text-sm font-semibold text-neutral-950 hover:bg-neutral-200"
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
      <p className="text-sm font-semibold text-stone-700">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-neutral-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-6 text-neutral-600">{description}</p>
    </div>
  );
}
