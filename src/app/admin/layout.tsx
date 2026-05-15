import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { logout } from "./actions";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <div>
      <div className="border-b border-neutral-200 bg-neutral-950 text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <Link href="/admin" className="hover:underline">
              관리자 홈
            </Link>
            <Link href="/admin/posts" className="hover:underline">
              게시글 관리
            </Link>
            <Link href="/admin/inquiries" className="hover:underline">
              문의 관리
            </Link>
            <Link href="/" className="hover:underline">
              사이트 보기
            </Link>
          </nav>
          <form action={logout}>
            <button
              type="submit"
              className="border border-white/30 px-3 py-1.5 text-sm font-semibold hover:border-white"
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
