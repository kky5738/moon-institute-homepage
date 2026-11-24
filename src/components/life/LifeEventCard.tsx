import Image from "next/image";
import Link from "next/link";
import type { LifeRecordCardData } from "@/lib/life-records";
import styles from "./life.module.css";

export function LifeEventCard({ record }: { record: LifeRecordCardData }) {
  return (
    <article className={styles.card}>
      <Link href={`/life/${record.slug}`} className={styles.cardLink}>
        {record.coverImage ? (
          <div className={styles.photo}>
            <Image src={`/life-images/${record.coverImage.id}`} alt={record.imageAlt}
              width={record.coverImage.imageWidth ?? 1200} height={record.coverImage.imageHeight ?? 900}
              unoptimized className={styles.cardImage} />
          </div>
        ) : null}
        <div className={styles.caption}>
          <p className={styles.year}>{record.year}년</p>
          <h3>{record.title}</h3>
          <p className={styles.summary}>{record.summary}</p>
          <span className={styles.readMore}>자세히 보기</span>
        </div>
      </Link>
    </article>
  );
}
