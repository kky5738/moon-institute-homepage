import Link from "next/link";
import { LifeHighlightsFrame } from "./LifeHighlightsFrame";
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
        {!records.length && <p className={styles.preparing}>콘텐츠 준비 중</p>}
        <LifeHighlightsFrame preparing={!records.length}>
          {records.length ? records.map(record => <LifeEventCard key={record.id} record={record} />)
            : [0, 1, 2].map(slot => <div key={slot} className={styles.placeholderCard}>
                <div className={styles.placeholderPhoto} />
                <div className={styles.caption}>
                  <div className={styles.placeholderYear} />
                  <div className={styles.placeholderTitle} />
                  <div className={styles.placeholderSummary} />
                </div>
            </div>)}
        </LifeHighlightsFrame>
      </div>
    </section>
  );
}

export async function HomeLifeHighlights() {
  return <LifeHighlightsSection records={await getLifeHighlights()} />;
}
