import type { Metadata } from "next";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { LifeRecordForm } from "../LifeRecordForm";
import styles from "@/components/life/life.module.css";
export const metadata: Metadata = { title: "새 생애 사건", robots: { index: false, follow: false } };

export default async function NewLifeRecordPage() {
  await connection(); await requireAdmin();
  return <div className={styles.page}><h1>새 사건 추가</h1><LifeRecordForm /></div>;
}
