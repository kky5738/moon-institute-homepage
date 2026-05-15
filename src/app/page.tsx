import { connection } from "next/server";
import Link from "next/link";
import { getPinnedNotice } from "@/lib/posts";
import { homeHighlights } from "@/lib/site-content";

export default async function Home() {
  await connection();
  const pinnedNotice = await getPinnedNotice();

  return (
    <div>
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold text-stone-700">
              출범 준비 공식 홈페이지
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-neutral-950 sm:text-5xl">
              문선명 연구소의 출범과 자료 공유를 준비합니다
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              이 홈페이지는 연구소 출범 전 홍보 자료와 공지사항을 공유하고,
              출범 이후 공식 연구소 홈페이지로 자연스럽게 확장하기 위한
              MVP입니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/about"
                className="inline-flex h-11 items-center border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                연구소 소개
              </Link>
              <Link
                href="/notices"
                className="inline-flex h-11 items-center border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 hover:border-neutral-500"
              >
                공지사항 보기
              </Link>
              <Link
                href="/materials"
                className="inline-flex h-11 items-center border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 hover:border-neutral-500"
              >
                홍보자료 보기
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 hover:border-neutral-500"
              >
                문의/참여 신청
              </Link>
            </div>
          </div>
          <aside className="self-end border border-neutral-200 bg-stone-50 p-6">
            <p className="text-sm font-semibold text-stone-700">주요 공지</p>
            <h2 className="mt-4 text-xl font-semibold text-neutral-950">
              {pinnedNotice?.title ?? "등록된 공지사항이 없습니다"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              {pinnedNotice?.summary ??
                "Docker PostgreSQL을 실행하고 Prisma seed를 적용하면 공지사항이 표시됩니다."}
            </p>
            <p className="mt-5 text-sm text-neutral-500">
              {pinnedNotice?.publishedAt ?? "DB 연결 대기"}
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {homeHighlights.map((item) => (
            <article
              key={item.title}
              className="border border-neutral-200 bg-white p-6"
            >
              <h2 className="text-lg font-semibold text-neutral-950">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
