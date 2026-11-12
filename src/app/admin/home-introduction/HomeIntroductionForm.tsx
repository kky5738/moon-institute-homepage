"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { homeIntroduction } from "@/lib/site-content";
import { HOME_INTRODUCTION_GUIDANCE } from "@/lib/home-introduction-validation";
import { readHomeIntroductionFile } from "@/lib/home-introduction-file";
import { uploadHomeIntroductionFile } from "@/lib/home-introduction-upload-client";
import { acquireLock } from "@/lib/interaction-lock";
import { HomeIntroductionPreview } from "./HomeIntroductionPreview";

type Preview = Awaited<ReturnType<typeof readHomeIntroductionFile>>;
type FieldErrors = { file?: string; message?: string; altText?: string };
const inputClass = "mt-2 w-full border border-border bg-white px-3 py-2.5 text-base focus:border-primary focus:outline-2 focus:outline-primary disabled:opacity-60";

export function HomeIntroductionForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");
  const [altText, setAltText] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [reading, setReading] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const currentPreview = useRef<Preview | null>(null);
  const selection = useRef(0);
  const lock = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (currentPreview.current) URL.revokeObjectURL(currentPreview.current.previewUrl);
    };
  }, []);

  async function selectFile(nextFile: File | undefined) {
    const version = ++selection.current;
    if (currentPreview.current) URL.revokeObjectURL(currentPreview.current.previewUrl);
    currentPreview.current = null;
    setPreview(null);
    setFile(null);
    setErrors((previous) => ({ ...previous, file: undefined }));
    setResult(null);
    setReading(!!nextFile);
    if (!nextFile) return;
    try {
      const next = await readHomeIntroductionFile(nextFile);
      if (!mounted.current || version !== selection.current) {
        URL.revokeObjectURL(next.previewUrl);
        return;
      }
      currentPreview.current = next;
      setPreview(next);
      setFile(nextFile);
    } catch (error) {
      if (mounted.current && version === selection.current) setErrors((previous) => ({ ...previous, file: error instanceof Error && /[가-힣]/.test(error.message) ? error.message : "이미지를 읽을 수 없습니다. 다른 파일을 선택해주세요." }));
    } finally {
      if (mounted.current && version === selection.current) setReading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reading || !acquireLock(lock)) return;
    const nextErrors: FieldErrors = {};
    if (!file || !preview) nextErrors.file = "등록할 이미지를 선택해주세요.";
    if (!message.trim() || message.trim().length > 200) nextErrors.message = HOME_INTRODUCTION_GUIDANCE;
    if (!altText.trim() || altText.trim().length > 200) nextErrors.altText = "대체 텍스트는 필수이며 최대 200자입니다.";
    setErrors(nextErrors);
    setResult(null);
    if (Object.keys(nextErrors).length || !file) {
      lock.current = false;
      const firstField = nextErrors.file ? "introduction-file" : nextErrors.message ? "introduction-message" : "introduction-alt";
      document.getElementById(firstField)?.focus();
      return;
    }
    setPending(true);
    try {
      const saved = await uploadHomeIntroductionFile(file, { contentType: file.type, size: file.size, message, altText });
      if (mounted.current) {
        setPreview({ previewUrl: `/admin/home-introduction/${saved.id}/image?preview=1`, imageWidth: saved.imageWidth, imageHeight: saved.imageHeight });
        setResult({ ok: true, message: "등록했습니다. 아래 목록에서 확인할 수 있습니다. 공개 첫 화면은 변경되지 않았습니다." });
        router.replace("/admin/home-introduction");
      }
    } catch (error) {
      if (mounted.current) setResult({ ok: false, message: error instanceof Error && /[가-힣]/.test(error.message) ? error.message : "등록하지 못했습니다. 입력을 유지했으니 다시 시도해주세요." });
    } finally {
      lock.current = false;
      if (mounted.current) setPending(false);
    }
  }

  return (
    <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <form onSubmit={submit} noValidate aria-label="첫 화면 콘텐츠 등록" aria-busy={pending}>
        <fieldset disabled={pending} className="min-w-0 space-y-6">
          <legend className="mb-5 text-lg font-semibold">새 콘텐츠 등록</legend>
          <div>
            <label htmlFor="introduction-file" className="block text-sm font-semibold">이미지 <span className="text-muted">(필수)</span></label>
            <input id="introduction-file" type="file" accept="image/jpeg,image/png,image/webp" required
              aria-invalid={!!errors.file} aria-describedby={`introduction-file-help${errors.file ? " introduction-file-error" : ""}`}
              onChange={(event) => void selectFile(event.target.files?.[0])} className={`${inputClass} text-sm file:mr-3 file:border-0 file:bg-surface-alt file:px-3 file:py-2 file:text-primary-dark`} />
            <p id="introduction-file-help" className="mt-2 text-xs leading-5 text-muted">JPEG·PNG·WebP, 최대 20MiB. 각 변 20,000px·총 4천만 화소 이하의 정지 이미지를 선택해주세요.</p>
            {reading ? <p role="status" className="mt-2 text-sm text-muted">이미지를 읽는 중…</p> : null}
            {preview ? <p className="mt-2 text-sm text-muted">표시 크기: {preview.imageWidth} × {preview.imageHeight}px</p> : null}
            {errors.file ? <p id="introduction-file-error" role="alert" className="mt-2 text-sm text-red-700">{errors.file}</p> : null}
          </div>
          <div>
            <label htmlFor="introduction-message" className="block text-sm font-semibold">문구 <span className="text-muted">(필수)</span></label>
            <textarea id="introduction-message" value={message} onChange={(event) => { setMessage(event.target.value); setErrors((previous) => ({ ...previous, message: undefined })); setResult(null); }} required maxLength={200} rows={3}
              aria-invalid={!!errors.message} aria-describedby={`introduction-message-help${errors.message ? " introduction-message-error" : ""}`} className={inputClass} />
            <p id="introduction-message-help" className="mt-2 text-xs leading-5 text-muted">{HOME_INTRODUCTION_GUIDANCE} ({message.length}/200)</p>
            {errors.message ? <p id="introduction-message-error" role="alert" className="mt-2 text-sm text-red-700">{errors.message}</p> : null}
          </div>
          <div>
            <label htmlFor="introduction-alt" className="block text-sm font-semibold">이미지 대체 텍스트 <span className="text-muted">(필수)</span></label>
            <input id="introduction-alt" type="text" value={altText} onChange={(event) => { setAltText(event.target.value); setErrors((previous) => ({ ...previous, altText: undefined })); setResult(null); }} required maxLength={200}
              aria-invalid={!!errors.altText} aria-describedby={`introduction-alt-help${errors.altText ? " introduction-alt-error" : ""}`} className={inputClass} />
            <p id="introduction-alt-help" className="mt-2 text-xs leading-5 text-muted">이미지를 보지 못하는 방문자에게 내용을 설명해주세요. ({altText.length}/200)</p>
            {errors.altText ? <p id="introduction-alt-error" role="alert" className="mt-2 text-sm text-red-700">{errors.altText}</p> : null}
          </div>
          <button type="submit" disabled={pending || reading} className="w-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-wait disabled:opacity-60">
            {pending ? "이미지 업로드·등록 중…" : "콘텐츠 등록"}
          </button>
        </fieldset>
        <p className="mt-3 text-xs leading-5 text-muted">등록한 콘텐츠는 보관 목록에 추가됩니다. 등록만으로 공개 첫 화면이 바뀌지 않습니다.</p>
        {result ? <p role={result.ok ? "status" : "alert"} className={`mt-4 border p-3 text-sm leading-6 ${result.ok ? "border-border text-primary-dark" : "border-red-200 text-red-700"}`}>{result.message}</p> : null}
      </form>
      <HomeIntroductionPreview
        image={preview?.previewUrl ?? homeIntroduction.image}
        imageWidth={preview?.imageWidth ?? homeIntroduction.image.width}
        imageHeight={preview?.imageHeight ?? homeIntroduction.image.height}
        altText={preview ? altText : homeIntroduction.alt}
        message={message}
      />
    </div>
  );
}
