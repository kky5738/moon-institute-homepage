import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "관리자",
  description: "문선명 연구소 홈페이지 관리자 화면입니다.",
};

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8">
      <div className="border-b border-neutral-200 pb-8">
        <p className="text-sm font-semibold text-stone-700">관리자</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950">
          관리자 홈
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
          단일 관리자 계정으로 공지사항, 홍보자료, 문의 접수 내역을 관리합니다.
        </p>
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        <Link
          href="/admin/posts"
          className="border border-neutral-200 bg-white p-6 hover:border-neutral-400"
        >
          <h2 className="text-xl font-semibold text-neutral-950">게시글 관리</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            공지사항과 홍보자료 게시글을 확인하고 새 글을 작성합니다.
          </p>
        </Link>
        <Link
          href="/admin/inquiries"
          className="border border-neutral-200 bg-white p-6 hover:border-neutral-400"
        >
          <h2 className="text-xl font-semibold text-neutral-950">문의 관리</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            일반 문의, 참여 신청, 후원 관심 접수 내역을 확인하고 상태를 관리합니다.
          </p>
        </Link>
      </section>
    </div>
  );
}
