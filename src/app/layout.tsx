import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "문선명 연구소",
    template: "%s | 문선명 연구소",
  },
  description: "문선명 연구소 공식 홈페이지입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-stone-50 text-neutral-950">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-neutral-200 bg-white/95">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <Link href="/" className="flex flex-col">
                <span className="text-lg font-semibold tracking-tight">
                  문선명 연구소
                </span>
                <span className="text-sm text-neutral-500">
                  M Institute
                </span>
              </Link>
              <nav
                aria-label="주요 메뉴"
                className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-neutral-700"
              >
                <Link className="hover:text-neutral-950" href="/about">
                  연구소 소개
                </Link>
                <Link className="hover:text-neutral-950" href="/notices">
                  공지사항
                </Link>
                <Link className="hover:text-neutral-950" href="/materials">
                  홍보자료
                </Link>
                <Link className="hover:text-neutral-950" href="/contact">
                  문의/참여
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-neutral-200 bg-white">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <p>문선명 연구소</p>
              <Link href="/contact" className="hover:text-neutral-950">
                문의 및 참여 신청
              </Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
