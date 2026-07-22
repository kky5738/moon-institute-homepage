"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { getAuthNavigation } from "@/lib/user-auth";

const navItems = [
  { label: "연구 주제", href: "/topics" },
  { label: "공지사항", href: "/notices" },
  { label: "자료 아카이브", href: "/materials" },
  { label: "문의/참여", href: "/contact" },
];

export function SiteNavbar({
  role,
}: {
  role: "ADMIN" | "RESEARCHER" | null;
}) {
  const pathname = usePathname();
  const authItem = getAuthNavigation(role);
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const elevated = !isHome || scrolled || open;
  const headerClassName = [
    isHome ? "fixed inset-x-0 top-0" : "sticky top-0",
    "z-50 transition-all duration-300",
    elevated
      ? "border-b border-border bg-background/90 shadow-[var(--shadow-soft)] backdrop-blur-md"
      : "bg-transparent",
  ].join(" ");
  const textClassName = elevated ? "text-foreground" : "text-white";
  const mutedTextClassName = elevated ? "text-muted" : "text-white/80";

  return (
    <header className={headerClassName}>
      <nav
        aria-label="주요 메뉴"
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-10"
      >
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground">
            文
          </span>
          <span className="flex flex-col leading-none">
            <span className={`text-base font-semibold tracking-tight ${textClassName}`}>
              문선명 연구소
            </span>
            <span className={`mt-1 text-xs ${mutedTextClassName}`}>
              M Institute
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`text-sm font-medium transition-colors hover:text-gold ${mutedTextClassName}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href={authItem.href}
            aria-current={pathname === authItem.href ? "page" : undefined}
            className={buttonVariants({
              variant: elevated ? "outline" : "inverseOutline",
            })}
          >
            {authItem.label}
          </Link>
          <Link href="/contact" className={buttonVariants()}>
            참여 신청
          </Link>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((current) => !current)}
          className={`grid lg:hidden ${
            elevated
              ? "border-border bg-transparent text-foreground hover:bg-secondary"
              : "border-white/35 bg-transparent text-white hover:bg-white/10"
          }`}
        >
          <span aria-hidden="true" className="text-xl leading-none">
            {open ? "×" : "≡"}
          </span>
        </Button>
      </nav>

      {open ? (
        <div id="mobile-menu" className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto w-full max-w-7xl px-5 py-4 sm:px-6">
            <div className="grid gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className="border-b border-border/70 py-3 text-base font-medium text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Link
              href={authItem.href}
              aria-current={pathname === authItem.href ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "mt-4 w-full",
              })}
            >
              {authItem.label}
            </Link>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className={buttonVariants({
                size: "lg",
                className: "mt-2 w-full",
              })}
            >
              참여 신청
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
