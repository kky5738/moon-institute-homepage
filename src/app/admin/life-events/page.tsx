import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { lifeRecordWhere } from "@/lib/life-records";
import { parseLifeRecordSearch, lifeRecordSearchPath } from "@/lib/life-record-validation";
import { getPostPageWindow, parsePageParam, POSTS_PER_PAGE } from "@/lib/pagination";
import { Pagination } from "@/components/site/Pagination";
import { LifeRecordSearch } from "@/components/life/LifeRecordSearch";
import styles from "@/components/life/life.module.css";

export const metadata: Metadata = { title: "생애 기록 관리", robots: { index: false, follow: false } };

export default async function AdminLifeRecords({ searchParams }: {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[]; year?: string | string[] }>;
}) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const search = parseLifeRecordSearch(params);
  const where = lifeRecordWhere(search, false);
  const pagination = getPostPageWindow(parsePageParam(params.page), await prisma.lifeRecord.count({ where }));
  const records = await prisma.lifeRecord.findMany({
    where, select: { id: true, slug: true, title: true, year: true, status: true, featured: true, sortOrder: true },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }], skip: pagination.offset, take: POSTS_PER_PAGE,
  });
  return <div className={styles.page}>
    <header className={styles.sectionHeader}><h1>생애 기록 관리</h1><Link href="/admin/life-events/new" className={styles.button}>새 사건 추가</Link></header>
    <p className={styles.intro}>사건의 상세 내용과 사진을 편집하고 홈에 소개할 카드를 선택합니다.</p>
    <LifeRecordSearch action="/admin/life-events" {...search} />
    <p className={styles.help}>전체 {pagination.totalItems.toLocaleString()}건 · 최근 수정순</p>
    <ul className={styles.list}>{records.map(record => <li key={record.id} className={`${styles.listItem} ${styles.adminRow}`}>
      <div><p className={styles.help}>{record.year ? `${record.year}년` : "연도 미입력"} · {record.status === "PUBLISHED" ? "공개" : record.status === "ARCHIVED" ? "보관" : "비공개 초안"}{record.featured ? ` · 홈 카드 선택 · 순서 ${record.sortOrder}` : ""}</p><h2 className={styles.listTitle}>{record.title}</h2></div>
      <div className="flex gap-5"><Link href={`/admin/life-events/${record.id}/edit`} className={styles.textLink}>편집<span className="sr-only">: {record.title}</span></Link>{record.status === "PUBLISHED" && <Link href={`/life/${record.slug}`} className={styles.textLink}>공개 페이지<span className="sr-only">: {record.title}</span></Link>}</div>
    </li>)}</ul>
    {!records.length && <p className={styles.empty}>등록된 사건 또는 검색 결과가 없습니다.</p>}
    <Pagination basePath={lifeRecordSearchPath("/admin/life-events", search)} page={pagination.page} totalPages={pagination.totalPages} />
  </div>;
}
