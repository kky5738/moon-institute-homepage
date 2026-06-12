import Link from "next/link";

const footerColumns = [
  {
    title: "연구소",
    links: [
      { label: "연구 주제", href: "/topics" },
      { label: "공지사항", href: "/notices" },
    ],
  },
  {
    title: "자료",
    links: [
      { label: "홍보자료", href: "/materials" },
      { label: "운영 안내", href: "/notices" },
      { label: "자료 문의", href: "/contact" },
    ],
  },
  {
    title: "참여",
    links: [
      { label: "문의하기", href: "/contact" },
      { label: "참여 신청", href: "/contact" },
      { label: "후원 관심", href: "/contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-primary-dark text-white/80">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-10 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-lg font-semibold text-white">
                文
              </span>
              <div>
                <p className="text-lg font-semibold text-white">문선명 연구소</p>
                <p className="mt-1 text-xs text-white/55">M Institute</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/65">
              출범 전 홍보 운영부터 공식 홈페이지 전환까지 공지, 자료,
              문의 기록을 장기 보존하는 공개 창구로 준비합니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h2 className="text-sm font-semibold text-white">{column.title}</h2>
                <ul className="mt-4 grid gap-2.5">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/65 transition-colors hover:text-gold"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Moon Institute. All rights reserved.</p>
          <Link href="/contact" className="hover:text-white">
            문의 및 참여 신청
          </Link>
        </div>
      </div>
    </footer>
  );
}
