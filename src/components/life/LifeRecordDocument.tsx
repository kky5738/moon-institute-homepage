import Image from "next/image";
import Link from "next/link";
import type { LifeRecordCardData } from "@/lib/life-records";
import styles from "./life.module.css";

export function LifeRecordDocument({ record, preview = false }: {
  record: LifeRecordCardData & { content: string; source: string }; preview?: boolean;
}) {
  return (
    <article className={styles.document}>
      <Link href={preview ? `/admin/life-events/${record.id}/edit` : "/life"} className={styles.textLink}>
        {preview ? "사건 편집으로 돌아가기" : "전체 기록 보기"}
      </Link>
      {preview && <p className={styles.notice}>관리자 미리보기 · 저장된 내용을 표시합니다.</p>}
      <header className={styles.documentHeader}>
        <p className={styles.year}>{record.year ? `${record.year}년` : "연도 미입력"}{record.dateLabel ? ` · ${record.dateLabel}` : ""}</p>
        <h1>{record.title}</h1>
        <p className={styles.lead}>{record.summary}</p>
      </header>
      {record.coverImage && <figure className={styles.documentPhoto}>
        <Image src={preview ? `/admin/life-events/images/${record.coverImage.id}` : `/life-images/${record.coverImage.id}`}
          alt={record.imageAlt} width={record.coverImage.imageWidth ?? 1200} height={record.coverImage.imageHeight ?? 900}
          unoptimized />
      </figure>}
      <div className={styles.body}>{record.content || (preview ? "상세 내용이 아직 입력되지 않았습니다." : "")}</div>
      {record.source && <section className={styles.source} aria-label="출처"><h2>출처</h2><p>{record.source}</p></section>}
    </article>
  );
}
