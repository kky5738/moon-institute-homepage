import Link from "next/link";
import styles from "./life.module.css";

export function LifeRecordSearch({ action, q, year }: { action: string; q: string; year: number | null }) {
  return (
    <form action={action} className={styles.search}>
      <label>검색어<input name="q" type="search" defaultValue={q} maxLength={100} placeholder="제목 또는 내용" /></label>
      <label>연도<input name="year" type="number" min={1000} max={9999} defaultValue={year ?? ""} placeholder="전체 연도" /></label>
      <button type="submit" className={styles.button}>검색</button>
      {(q || year) && <Link href={action} className={styles.textLink}>검색 초기화</Link>}
    </form>
  );
}
