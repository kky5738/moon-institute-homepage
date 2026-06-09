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
        <div className="flex min-h-screen flex-col">
          <SiteNavbar />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
