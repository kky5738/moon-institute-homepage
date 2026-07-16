import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNavbar } from "@/components/site/SiteNavbar";
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
      <body className="min-h-full bg-background text-foreground">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-white px-4 py-3 text-sm font-semibold text-primary-dark shadow-[var(--shadow-elegant)] focus:translate-y-0"
        >
          본문 바로가기
        </a>
        <div className="flex min-h-screen flex-col">
          <SiteNavbar />
          <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
