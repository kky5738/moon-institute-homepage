"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { validateHomeIntroductionInput } from "@/lib/home-introduction-validation";
import { MAX_HOME_LIFE_RECORDS } from "@/lib/life-record-validation";
import styles from "@/components/life/life.module.css";
import { saveLifeRecordAction, requestLifeImage, confirmLifeImage, cancelLifeImage } from "./actions";

type RecordInput = {
  id: string; title: string; year: number | null; dateLabel: string; summary: string; content: string;
  source: string; featured: boolean; sortOrder: number; coverImageId: string | null; imageAlt: string;
  status: string; updatedAt: string;
};
type SavedImage = { id: string; originalName: string };

export function LifeRecordForm({ record, images = [] }: { record?: RecordInput; images?: SavedImage[] }) {
  const [state, formAction, pending] = useActionState(saveLifeRecordAction, { message: "" });
  const [values, setValues] = useState({
    title: record?.title ?? "", year: record?.year?.toString() ?? "", dateLabel: record?.dateLabel ?? "",
    summary: record?.summary ?? "", content: record?.content ?? "", source: record?.source ?? "",
    featured: record?.featured ?? false, sortOrder: record?.sortOrder.toString() ?? "0",
    coverImageId: record?.coverImageId ?? "", imageAlt: record?.imageAlt ?? "",
  });
  const [photos, setPhotos] = useState(images);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const busy = pending || uploading;
  function change(name: keyof typeof values, value: string | boolean) { setValues(previous => ({ ...previous, [name]: value })); }

  async function upload(file?: File) {
    if (!file || !record || busy) return;
    setUploading(true); setUploadMessage("");
    let ticketId: string | undefined;
    try {
      validateHomeIntroductionInput({ contentType: file.type, size: file.size, message: "사건 사진", altText: "사건 사진" });
      const ticket = await requestLifeImage({ recordId: record.id, name: file.name, contentType: file.type, size: file.size });
      if (!ticket.ok) throw new Error(ticket.message);
      ticketId = ticket.id;
      const { createClient } = await import("@supabase/supabase-js");
      const storage = createClient(ticket.supabaseUrl, ticket.publishableKey, { auth: { autoRefreshToken: false, persistSession: false } }).storage.from(ticket.bucket);
      const { error } = await storage.uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
      if (error) throw new Error("사진 업로드에 실패했습니다.");
      const result = await confirmLifeImage(ticket.id);
      if (!result.ok) throw new Error(result.message);
      setPhotos(previous => [{ id: result.id, originalName: result.originalName }, ...previous]);
      change("coverImageId", result.id);
      setUploadMessage("사진이 등록되었습니다. 아래 저장 버튼으로 사건에 적용해주세요.");
    } catch (error) {
      let cleanupFailed = false;
      if (ticketId) {
        try { cleanupFailed = !(await cancelLifeImage(ticketId)).ok; } catch { cleanupFailed = true; }
      }
      const message = error instanceof Error && /[가-힣]/.test(error.message) ? error.message : "사진을 등록하지 못했습니다. 로그인 상태와 파일을 확인해주세요.";
      setUploadMessage(message + (cleanupFailed ? " 미완료 사진 정리를 마치지 못했습니다." : ""));
    } finally { setUploading(false); }
  }

  return <form action={formAction} className={styles.form} aria-busy={busy}>
    {record && <><input type="hidden" name="recordId" value={record.id} /><input type="hidden" name="updatedAt" value={record.updatedAt} /></>}
    {state.message && <p role="alert" className={styles.feedback}>{state.message} <a href="/login" target="_blank" rel="noopener noreferrer" className="underline">로그인 열기</a></p>}
    <fieldset disabled={busy || state.saved}>
      <legend className="sr-only">사건 편집</legend>
      <div className={styles.formGrid}>
        <div className={styles.fields}>
          <label className={styles.field}>제목<input name="title" required maxLength={160} value={values.title} onChange={e => change("title", e.target.value)} /></label>
          <label className={styles.field}>연도<input name="year" type="number" min={1000} max={9999} placeholder="예: 1920" value={values.year} onChange={e => change("year", e.target.value)} /></label>
          <label className={styles.field}>날짜 표기 <span className={styles.help}>선택 사항 · 정확한 날짜와 음력·양력 구분을 원문대로 적어주세요.</span><input name="dateLabel" maxLength={100} value={values.dateLabel} onChange={e => change("dateLabel", e.target.value)} /></label>
          <label className={styles.field}>짧은 설명<textarea name="summary" rows={3} maxLength={200} value={values.summary} onChange={e => change("summary", e.target.value)} /><span className={styles.help}>홈 카드에는 최대 2줄로 표시합니다. {values.summary.length}/200자</span></label>
          <label className={styles.field}>상세 내용<textarea name="content" rows={18} maxLength={100000} value={values.content} onChange={e => change("content", e.target.value)} /></label>
          <label className={styles.field}>출처<textarea name="source" rows={3} maxLength={2000} placeholder="자료명, 페이지, 원문 주소, 사진 출처 등" value={values.source} onChange={e => change("source", e.target.value)} /></label>
        </div>
        <aside className={styles.fields} aria-label="사진과 공개 설정">
          <label className={styles.field}>대표 사진
            <select name="coverImageId" value={values.coverImageId} onChange={e => change("coverImageId", e.target.value)}>
              <option value="">사진 없음</option>{photos.map(photo => <option key={photo.id} value={photo.id}>{photo.originalName}</option>)}
            </select>
          </label>
          {values.coverImageId && <Image src={`/admin/life-events/images/${values.coverImageId}`} alt={values.imageAlt || "선택한 대표 사진 미리보기"} width={1200} height={900} unoptimized className={styles.adminPhoto} />}
          {record ? <label className={styles.field}>새 사진 등록<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} /><span className={styles.help}>JPEG·PNG·WebP, 20MB 이하. 사진 선택 후 저장해야 공개 화면에 반영됩니다.</span></label>
            : <p className={styles.notice}>제목을 입력하고 임시저장하면 대표 사진을 등록할 수 있습니다.</p>}
          {(uploading || uploadMessage) && <p role="status" className={styles.notice}>{uploading ? "사진을 업로드하고 확인하는 중입니다." : uploadMessage}</p>}
          <label className={styles.field}>사진 대체 설명<input name="imageAlt" maxLength={300} value={values.imageAlt} onChange={e => change("imageAlt", e.target.value)} /><span className={styles.help}>사진을 볼 수 없는 방문자를 위한 설명입니다.</span></label>
          <label className={styles.check}><input name="featured" type="checkbox" checked={values.featured} onChange={e => change("featured", e.target.checked)} /><span>홈 카드에 표시<span className={`block ${styles.help}`}>공개된 사건 중 최대 {MAX_HOME_LIFE_RECORDS}건. 해제해도 전체 목록에는 남습니다.</span></span></label>
          <label className={styles.field}>표시 순서<input name="sortOrder" type="number" min={0} max={999999} value={values.sortOrder} onChange={e => change("sortOrder", e.target.value)} /><span className={styles.help}>작은 숫자가 먼저 표시됩니다. 전체 목록은 연도순이며 같은 연도 안에서 이 순서를 사용합니다.</span></label>
          <p className={styles.help}>현재 상태: {record?.status === "PUBLISHED" ? "공개" : record?.status === "ARCHIVED" ? "보관" : "비공개 초안"}</p>
          {record && <Link href={`/admin/life-events/${record.id}/preview`} target="_blank" className={styles.textLink}>저장된 상세 내용 미리보기 (새 창)</Link>}
        </aside>
      </div>
    </fieldset>
    <div className={styles.toolbar}>
      <button type="submit" name="intent" value="draft" disabled={busy || state.saved} className={`${styles.button} ${styles.secondary}`}>{pending ? "저장 중…" : record?.status === "PUBLISHED" ? "비공개로 저장" : "임시저장"}</button>
      <button type="submit" name="intent" value="publish" disabled={busy || state.saved} className={styles.button}>{pending ? "저장 중…" : "저장 후 공개"}</button>
      {record && <button type="submit" name="intent" value="archive" disabled={busy || state.saved} className={`${styles.button} ${styles.secondary}`}>보관하기</button>}
      <Link href="/admin/life-events" className={styles.textLink} onClick={e => { if (busy) e.preventDefault(); }}>관리 목록</Link>
    </div>
    <p className={styles.help}>보관하면 홈·전체 목록·상세 페이지에서 비공개로 전환되며, 내용은 관리자에서 다시 편집하고 공개할 수 있습니다.</p>
  </form>;
}
