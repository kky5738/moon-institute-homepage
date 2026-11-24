import Link from "next/link";
import { LifeEventCard } from "@/components/life/LifeEventCard";
import { getLifeHighlights, type LifeRecordCardData } from "@/lib/life-records";
import styles from "@/components/life/life.module.css";

export function LifeHighlightsSection({ records }: { records: LifeRecordCardData[] }) {
  return (
    <section id="life-timeline" aria-labelledby="life-highlights-title" className={styles.highlights}>
      <div className={styles.container}>
        <header className={styles.sectionHeader}>
          <div><p className={styles.eyebrow}>Life Archive</p><h2 id="life-highlights-title">생애의 주요 기록</h2></div>
          <Link href="/life" className={styles.textLink}>전체 기록 보기</Link>
        </header>
        {records.length ? (
          <ol className={styles.cards}>{records.map(record => <li key={record.id}><LifeEventCard record={record} /></li>)}</ol>
        ) : <p className={styles.empty}>생애의 주요 기록을 준비하고 있습니다.</p>}
      </div>
    </section>
  );
}

export async function HomeLifeHighlights() {
  return <LifeHighlightsSection records={await getLifeHighlights()} />;
}
