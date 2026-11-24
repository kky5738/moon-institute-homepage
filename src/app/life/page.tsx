import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/site/Pagination";
import { LifeRecordSearch } from "@/components/life/LifeRecordSearch";
import styles from "@/components/life/life.module.css";
import { getLifeRecordPage } from "@/lib/life-records";
import { parsePageParam } from "@/lib/pagination";
import { parseLifeRecordSearch, lifeRecordSearchPath } from "@/lib/life-record-validation";

export const metadata: Metadata = { title: "생애 기록", description: "문선명 선생의 생애 기록을 연대순으로 살펴봅니다." };

export default async function LifePage({ searchParams }: {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[]; year?: string | string[] }>;
}) {
  const params = await searchParams;
  const search = parseLifeRecordSearch(params);
  const result = await getLifeRecordPage(parsePageParam(params.page), search);
  return <div className={styles.page}>
    <p className={styles.eyebrow}>Life Archive</p><h1>생애 기록</h1>
    <p className={styles.intro}>문선명 선생의 생애를 기록으로 살펴봅니다.</p>
    <LifeRecordSearch action="/life" {...search} />
    <p className={styles.help}>연대순 · {result.totalItems.toLocaleString()}건</p>
    <ol className={styles.list}>{result.records.map(record => <li key={record.id} className={styles.listItem}>
      <Link href={`/life/${record.slug}`} className={styles.listLink}>
        <span className={styles.year}>{record.year}년</span>
        <div><h2 className={styles.listTitle}>{record.title}</h2><p className={styles.listSummary}>{record.summary}</p></div>
      </Link>
    </li>)}</ol>
    {!result.records.length && <p className={styles.empty}>{search.q || search.year ? "검색 조건에 맞는 기록이 없습니다." : "공개된 기록이 아직 없습니다."}</p>}
    <Pagination basePath={lifeRecordSearchPath("/life", search)} page={result.page} totalPages={result.totalPages} />
  </div>;
}
