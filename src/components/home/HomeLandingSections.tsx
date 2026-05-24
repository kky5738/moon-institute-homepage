import Link from "next/link";
import type { BoardPost } from "@/lib/posts";
import {
  activityItems,
  monthlyNewsItems,
  videoContentItems,
} from "@/lib/site-content";

type HomeLandingSectionsProps = {
  notices: BoardPost[];
  materials: BoardPost[];
};

export function HomeLandingSections({
  notices,
  materials,
}: HomeLandingSectionsProps) {
  const latestNotice = notices[0];

  return (
    <>
      <HomeSection
        eyebrow="연구소 주요 소식"
        title="월간 흐름과 주요 업데이트"
        description="공식 공지와 자료 업데이트를 한눈에 살피고, 매달 쌓이는 연구소의 흐름을 차분하게 정리합니다."
      >
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="border border-neutral-200 bg-white p-6">
            <p className="text-sm font-semibold text-stone-700">주요 공지</p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950">
              {latestNotice?.title ?? "등록된 공지사항이 없습니다"}
            </h3>
            <p className="mt-4 text-sm leading-6 text-neutral-600">
              {latestNotice?.summary ??
                "새 공지사항이 등록되면 이곳에 주요 소식으로 표시됩니다."}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium text-neutral-500">
                {latestNotice?.publishedAt ?? "공지 대기"}
              </span>
              <Link
                href={latestNotice ? `/notices/${latestNotice.slug}` : "/notices"}
                className="font-semibold text-neutral-950 hover:underline"
              >
                자세히 보기
              </Link>
            </div>
          </article>

          <div className="grid gap-5">
            {monthlyNewsItems.map((item) => (
              <article key={item.title} className="border border-neutral-200 bg-stone-50 p-5">
                <p className="text-xs font-semibold text-stone-700">{item.label}</p>
                <h3 className="mt-2 text-lg font-semibold text-neutral-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </HomeSection>

      <HomeSection
        eyebrow="영상 콘텐츠"
        title="소개와 해설을 영상으로 확장합니다"
        description="아직 영상 공개 전이라도, 향후 콘텐츠가 들어올 자리를 명확히 두어 운영자가 쉽게 채워갈 수 있게 구성했습니다."
        tone="muted"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {videoContentItems.map((item) => (
            <article key={item.title} className="border border-neutral-200 bg-white">
              <div className="aspect-video border-b border-neutral-200 bg-neutral-200" />
              <div className="p-5">
                <p className="text-xs font-semibold text-stone-700">{item.meta}</p>
                <h3 className="mt-3 text-lg font-semibold text-neutral-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </HomeSection>

      <HomeSection
        eyebrow="활동과 자료"
        title="활동, 자료, 공지를 연결합니다"
        description="방문자가 연구소의 방향을 이해하고 필요한 게시판으로 자연스럽게 이동할 수 있도록 주요 경로를 정리했습니다."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {activityItems.map((item) => (
            <article key={item.title} className="border border-neutral-200 bg-white p-6">
              <h3 className="text-xl font-semibold text-neutral-950">{item.title}</h3>
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

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <CompactPostList
            title="최근 공지"
            emptyText="등록된 공지사항이 없습니다."
            href="/notices"
            posts={notices.slice(0, 3)}
            getPostHref={(post) => `/notices/${post.slug}`}
          />
          <CompactPostList
            title="최근 자료"
            emptyText="등록된 홍보자료가 없습니다."
            href="/materials"
            posts={materials.slice(0, 3)}
            getPostHref={(post) => `/materials/${post.slug}`}
          />
        </div>
      </HomeSection>

      <section className="border-t border-neutral-200 bg-neutral-950 text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold text-stone-300">참여와 문의</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              문의, 참여 신청, 후원 관심을 남겨주세요
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-300">
              남겨주신 내용은 관리자만 확인하며, 연구소 운영과 향후 안내를 위한
              기록으로 신중하게 관리합니다.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex h-11 items-center justify-center border border-white bg-white px-5 text-sm font-semibold text-neutral-950 hover:bg-neutral-200"
          >
            문의/참여 신청
          </Link>
        </div>
      </section>
    </>
  );
}

function HomeSection({
  eyebrow,
  title,
  description,
  tone = "default",
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tone?: "default" | "muted";
  children: React.ReactNode;
}) {
  return (
    <section className={tone === "muted" ? "bg-stone-100" : "bg-stone-50"}>
      <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8 lg:py-16">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold text-stone-700">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
            {title}
          </h2>
          <p className="mt-4 text-sm leading-6 text-neutral-600">{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

function CompactPostList({
  title,
  emptyText,
  href,
  posts,
  getPostHref,
}: {
  title: string;
  emptyText: string;
  href: string;
  posts: BoardPost[];
  getPostHref: (post: BoardPost) => string;
}) {
  return (
    <section className="border border-neutral-200 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-neutral-200 px-5 py-4">
        <h3 className="text-lg font-semibold text-neutral-950">{title}</h3>
        <Link href={href} className="text-sm font-semibold text-neutral-700 hover:text-neutral-950">
          전체 보기
        </Link>
      </div>
      <div className="divide-y divide-neutral-200">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Link
              key={post.id}
              href={getPostHref(post)}
              className="block px-5 py-4 hover:bg-stone-50"
            >
              <p className="text-sm font-semibold text-neutral-950">{post.title}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-600">
                {post.summary}
              </p>
              <p className="mt-3 text-xs font-medium text-neutral-500">
                {post.publishedAt} · {post.category}
              </p>
            </Link>
          ))
        ) : (
          <p className="px-5 py-8 text-sm text-neutral-500">{emptyText}</p>
        )}
      </div>
    </section>
  );
}
