"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import styles from "@/components/posts/post-editor.module.css";
import { Button } from "@/components/ui/button";
import { acquireLock } from "@/lib/interaction-lock";
import {
  createResearchImageMarker,
  formatResearchFileSize,
  getResearchExistingAttachmentIds,
  getResearchImageIds,
  getResearchUploadPlan,
  replaceResearchImageMarker,
  resetResearchUploadForRetry,
  type ResearchUploadKind,
  validateResearchUpload,
} from "@/lib/research-files";
import {
  confirmResearchUpload,
  discardResearchUpload,
  prepareResearchPost,
  requestResearchUpload,
  saveResearchPost,
} from "./actions";

type ExistingFile = {
  id: string;
  kind: ResearchUploadKind;
  originalName: string;
  size: number;
  altText: string | null;
  committed?: boolean;
};

type PendingFile = ExistingFile & {
  file: File;
  contentType: string;
  imageWidth: number | null;
  imageHeight: number | null;
  uploaded?: boolean;
};

type ResearchPostFormProps = {
  post?: {
    id: number;
    title: string;
    status: string;
    content: string;
    attachments: ExistingFile[];
  };
};

export function ResearchPostForm({ post }: ResearchPostFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const submitLockRef = useRef(false);
  const imageInsertLockRef = useRef(false);
  const [postId, setPostId] = useState(post?.id ?? null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [recoveredKeepIds, setRecoveredKeepIds] = useState<string[]>([]);
  const [imageAlt, setImageAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [imageInserting, setImageInserting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const visibleExisting =
    post?.attachments.filter((file) => !removedIds.includes(file.id)) ?? [];
  const recoveredFiles = visibleExisting.filter(
    (file) => file.committed === false,
  );

  async function addInlineImage() {
    setError("");
    const file = imageInputRef.current?.files?.[0];
    if (!file) return setError("본문에 넣을 이미지를 선택해주세요.");

    try {
      const dimensions = await getImageDimensions(file);
      const id = crypto.randomUUID();
      const metadata = validateResearchUpload({
        id,
        kind: "INLINE_IMAGE",
        name: file.name,
        size: file.size,
        contentType: file.type,
        altText: imageAlt,
        imageWidth: dimensions.width,
        imageHeight: dimensions.height,
      });
      const textarea = contentRef.current;
      if (!textarea) throw new Error("본문 입력란을 찾을 수 없습니다.");

      const marker = `\n${createResearchImageMarker(id)}\n`;
      textarea.setRangeText(
        marker,
        textarea.selectionStart,
        textarea.selectionEnd,
        "end",
      );
      textarea.focus();
      setPendingFiles((files) => [
        ...files,
        {
          id,
          kind: "INLINE_IMAGE",
          originalName: metadata.originalName,
          size: metadata.size,
          altText: metadata.altText,
          contentType: metadata.contentType,
          imageWidth: metadata.imageWidth,
          imageHeight: metadata.imageHeight,
          file,
        },
      ]);
      setImageAlt("");
      if (imageInputRef.current) imageInputRef.current.value = "";
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }

  async function handleInsertInlineImage() {
    if (submitLockRef.current || !acquireLock(imageInsertLockRef)) return;
    setImageInserting(true);
    try {
      await addInlineImage();
    } finally {
      imageInsertLockRef.current = false;
      setImageInserting(false);
    }
  }

  function addAttachments(files: FileList | null) {
    if (!files) return;
    setError("");

    try {
      const additions = [...files].map((file) => {
        const id = crypto.randomUUID();
        const metadata = validateResearchUpload({
          id,
          kind: "ATTACHMENT",
          name: file.name,
          size: file.size,
          contentType: file.type || getFallbackContentType(file.name),
        });
        return {
          id,
          kind: "ATTACHMENT" as const,
          originalName: metadata.originalName,
          size: metadata.size,
          altText: null,
          contentType: metadata.contentType,
          imageWidth: null,
          imageHeight: null,
          file,
        };
      });
      setPendingFiles((current) => [...current, ...additions]);
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }

  function keepRecoveredFile(file: ExistingFile) {
    if (file.kind === "INLINE_IMAGE") {
      const textarea = contentRef.current;
      if (!textarea) return setError("본문 입력란을 찾을 수 없습니다.");
      if (!getResearchImageIds(textarea.value).includes(file.id)) {
        const cursor = textarea.selectionEnd;
        textarea.setRangeText(
          `\n${createResearchImageMarker(file.id)}\n`,
          cursor,
          cursor,
          "end",
        );
        textarea.focus();
      }
    }

    setRecoveredKeepIds((ids) =>
      ids.includes(file.id) ? ids : [...ids, file.id],
    );
    setError("");
  }

  async function removeFile(file: ExistingFile) {
    const pending = pendingFiles.find((item) => item.id === file.id);
    if (pending?.uploaded || file.committed === false) {
      try {
        await discardResearchUpload(file.id);
      } catch (cause) {
        setError(getErrorMessage(cause));
        return;
      }
    }

    setPendingFiles((files) => files.filter((item) => item.id !== file.id));
    setRecoveredKeepIds((ids) => ids.filter((id) => id !== file.id));
    if (post?.attachments.some((item) => item.id === file.id)) {
      setRemovedIds((ids) => [...ids, file.id]);
    }
    if (file.kind === "INLINE_IMAGE" && contentRef.current) {
      contentRef.current.value = contentRef.current.value.replaceAll(
        createResearchImageMarker(file.id),
        "",
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (imageInsertLockRef.current) {
      setError("본문 이미지 삽입이 끝난 뒤 저장해주세요.");
      return;
    }
    if (!acquireLock(submitLockRef)) return;
    setBusy(true);
    setError("");

    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const formData = new FormData(event.currentTarget);
    formData.set("intent", submitter?.value === "draft" ? "draft" : "publish");
    if (postId) formData.set("id", String(postId));

    try {
      if (recoveredFiles.some((file) => !recoveredKeepIds.includes(file.id))) {
        throw new Error("복구할 파일은 저장에 포함하거나 제거한 뒤 저장해주세요.");
      }

      const imageIds = new Set(
        getResearchImageIds(String(formData.get("content") ?? "")),
      );
      if (
        recoveredFiles.some(
          (file) =>
            file.kind === "INLINE_IMAGE" &&
            recoveredKeepIds.includes(file.id) &&
            !imageIds.has(file.id),
        )
      ) {
        throw new Error("본문에 복구한 이미지를 유지하거나 파일을 제거해주세요.");
      }

      const prepared = await prepareResearchPost(formData);
      if (!prepared.ok) throw new Error(prepared.message);
      setPostId(prepared.postId);
      formData.set("id", String(prepared.postId));

      const existingIds = getResearchExistingAttachmentIds(
        visibleExisting,
        new Set(recoveredKeepIds),
        imageIds,
      );
      const { uploads, attachmentIds } = getResearchUploadPlan(
        pendingFiles,
        imageIds,
        existingIds,
      );

      for (const pending of uploads) {
        setStatus(`${pending.originalName} 업로드 중`);
        try {
          const ticket = await requestResearchUpload(prepared.postId, {
            id: pending.id,
            kind: pending.kind,
            name: pending.originalName,
            size: pending.size,
            contentType: pending.contentType,
            altText: pending.altText,
            imageWidth: pending.imageWidth,
            imageHeight: pending.imageHeight,
          });
          if (!ticket.ok) throw new Error(ticket.message);

          const { createClient } = await import("@supabase/supabase-js");
          const storage = createClient(ticket.supabaseUrl, ticket.publishableKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          }).storage.from(ticket.bucket);
          // ponytail: standard signed upload is enough for the 20MiB ceiling; add TUS only if real uploads prove unreliable.
          const { error: uploadError } = await storage.uploadToSignedUrl(
            ticket.path,
            ticket.token,
            pending.file,
            { contentType: pending.contentType },
          );
          if (uploadError) {
            throw new Error(`${pending.originalName} 업로드에 실패했습니다.`);
          }

          const confirmed = await confirmResearchUpload(pending.id);
          if (!confirmed.ok) throw new Error(confirmed.message);
        } catch (cause) {
          let cleanupError: unknown;
          let cleanupFailed = false;
          try {
            await discardResearchUpload(pending.id);
          } catch (error) {
            cleanupFailed = true;
            cleanupError = error;
          }

          const retryId = crypto.randomUUID();
          setPendingFiles((files) =>
            resetResearchUploadForRetry(files, pending.id, retryId),
          );
          if (pending.kind === "INLINE_IMAGE" && contentRef.current) {
            contentRef.current.value = replaceResearchImageMarker(
              contentRef.current.value,
              pending.id,
              retryId,
            );
          }

          if (cleanupFailed) {
            throw new Error(
              `${getErrorMessage(cause)} 이전 업로드 정리 요청도 실패했습니다: ${getErrorMessage(cleanupError)}`,
            );
          }
          throw cause;
        }
        setPendingFiles((files) =>
          files.map((file) =>
            file.id === pending.id ? { ...file, uploaded: true } : file,
          ),
        );
      }

      setStatus("게시글 저장 중");
      for (const attachmentId of attachmentIds) {
        formData.append("attachmentId", attachmentId);
      }
      const saved = await saveResearchPost(formData);
      if (!saved.ok) throw new Error(saved.message);
      router.push(saved.redirectTo);
      router.refresh();
    } catch (cause) {
      setError(getErrorMessage(cause));
      setStatus("다시 저장할 수 있습니다.");
      submitLockRef.current = false;
      setBusy(false);
    }
  }

  const allFiles = [...visibleExisting, ...pendingFiles];
  const attachments = allFiles.filter((file) => file.kind === "ATTACHMENT");
  const inlineImages = allFiles.filter((file) => file.kind === "INLINE_IMAGE");

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={styles.form} aria-busy={busy}>
      {postId ? <input type="hidden" name="id" value={postId} /> : null}
      {removedIds.map((id) => (
        <input key={id} type="hidden" name="removedAttachmentId" value={id} />
      ))}

      <div className={styles.toolbar}>
        <p className={styles.state}>{post ? post.status === "PUBLISHED" ? "현재 공개 중" : "현재 임시저장" : "새 글"}</p>
        <div className={styles.actions}>
          <Link
            href="/account/posts"
            aria-disabled={busy}
            onClick={(event) => { if (busy) event.preventDefault(); }}
          >
            취소
          </Link>
          <Button
            type="submit"
            name="intent"
            value="draft"
            variant="outline"
            className={styles.secondaryButton}
            formNoValidate
            disabled={busy || imageInserting}
            aria-busy={busy || imageInserting}
          >
            {busy ? "저장 중" : imageInserting ? "이미지 준비 중" : "임시저장"}
          </Button>
          <Button
            type="submit"
            name="intent"
            value="publish"
            className={styles.primaryButton}
            disabled={busy || imageInserting}
            aria-busy={busy || imageInserting}
          >
            {busy
              ? "처리 중"
              : imageInserting
                ? "이미지 준비 중"
                : post
                  ? "저장 후 공개"
                  : "공개하기"}
          </Button>
        </div>
      </div>
      <div className={styles.feedback}>
        {error ? (
          <p
            role="alert"
            aria-live="assertive"
            className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
          >
            {error}
          </p>
        ) : status ? (
          <p role="status" aria-live="polite" className="text-sm text-muted">
            {status}
          </p>
        ) : null}
      </div>
      <div className={styles.grid}>
        <div className={styles.manuscript}>
          <FormField label="제목" htmlFor="title">
            <textarea
              rows={2}
              placeholder="글 제목을 입력하세요"
              id="title"
              name="title"
              required
              maxLength={200}
              disabled={busy}
              defaultValue={post?.title}
              className={styles.title}
            />
          </FormField>

          <div className={styles.bodyField}>
            <FormField label="본문" htmlFor="content">
              <textarea
                ref={contentRef}
                id="content"
                name="content"
                rows={18}
                required
                maxLength={100_000}
                disabled={busy}
                defaultValue={post?.content}
                placeholder="본문을 작성하세요"
                className={styles.content}
              />
            </FormField>

          </div>
        </div>
        <aside className={styles.sidebar} aria-label="파일과 게시 정보">
          <div className={styles.panel}>
            <h2>게시 위치</h2>
            <p className="mt-2 text-sm text-muted">연구 게시판</p>
            <p className="mt-3 text-xs leading-5 text-muted">공개하기를 누르면 바로 표시됩니다. 임시저장한 글은 내 글 목록에서 이어 쓸 수 있습니다.</p>
          </div>
          <fieldset className={styles.panel}>
            <legend className="px-2 text-sm font-semibold text-foreground">
              본문 이미지
            </legend>
            <div className="grid min-w-0 gap-3">
              <FormField label="이미지" htmlFor="inline-image">
                <input
                  ref={imageInputRef}
                  id="inline-image"
                  type="file"
                  disabled={busy}
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="mt-2 block w-full text-sm text-muted file:mr-3 file:cursor-pointer file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-sm file:font-semibold file:active:bg-secondary"
                />
              </FormField>
              <FormField label="이미지 설명" htmlFor="inline-image-alt">
                <input
                  id="inline-image-alt"
                  value={imageAlt}
                  disabled={busy}
                  onChange={(event) => setImageAlt(event.target.value)}
                  maxLength={300}
                  placeholder="이미지의 내용을 설명해주세요"
                  className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </FormField>
              <Button
                type="button"
                variant="outline"
                onClick={handleInsertInlineImage}
                disabled={busy || imageInserting}
              >
                {imageInserting ? "이미지 준비 중" : "현재 위치에 삽입"}
              </Button>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              JPEG, PNG, WebP · 파일당 최대 20MB. 미리보기 없이 본문의 현재 커서
              위치에 이미지 표식을 넣습니다.
            </p>
            <FileList
              files={inlineImages}
              keptRecoveredIds={recoveredKeepIds}
              onKeepRecovered={keepRecoveredFile}
              onRemove={removeFile}
              disabled={busy}
            />
          </fieldset>

          <fieldset className={styles.panel}>
            <legend className="px-2 text-sm font-semibold text-foreground">첨부파일</legend>
            <label htmlFor="attachments" className="sr-only">첨부 문서 선택</label>
            <input
              id="attachments"
              type="file"
              multiple
              disabled={busy}
              accept=".pdf,.hwp,.docx,application/pdf,application/x-hwp,application/haansofthwp,application/vnd.hancom.hwp,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => {
                addAttachments(event.target.files);
                event.currentTarget.value = "";
              }}
              className="block w-full text-sm text-muted file:mr-3 file:cursor-pointer file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-sm file:font-semibold file:active:bg-secondary"
            />
            <p className="mt-3 text-xs leading-5 text-muted">
              PDF, HWP, DOCX · 파일당 최대 20MB
            </p>
            <FileList
              files={attachments}
              keptRecoveredIds={recoveredKeepIds}
              onKeepRecovered={keepRecoveredFile}
              onRemove={removeFile}
              disabled={busy}
            />
          </fieldset>
        </aside>
      </div>
    </form>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function FileList({
  files,
  keptRecoveredIds,
  onKeepRecovered,
  onRemove,
  disabled,
}: {
  files: Array<ExistingFile & { uploaded?: boolean }>;
  keptRecoveredIds: string[];
  onKeepRecovered: (file: ExistingFile) => void;
  onRemove: (file: ExistingFile) => void;
  disabled: boolean;
}) {
  if (files.length === 0) return null;
  return (
    <ul className="mt-4 divide-y divide-border border-y border-border text-sm">
      {files.map((file) => (
        <li key={file.id} className="flex min-w-0 flex-wrap items-start justify-between gap-2 py-3">
          <span className="flex min-w-0 w-full flex-wrap items-baseline gap-x-2">
            <span className="break-all">
              {file.originalName} · {formatResearchFileSize(file.size)}
            </span>
            {file.committed === false ? (
              <span className="shrink-0 text-xs text-muted">
                업로드 완료 · 저장 미확정
                {keptRecoveredIds.includes(file.id) ? " · 유지 선택됨" : ""}
              </span>
            ) : file.uploaded ? (
              <span className="shrink-0 text-xs text-muted">
                업로드 완료 · 저장 대기
              </span>
            ) : null}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {file.committed === false ? (
              <button
                type="button"
                disabled={disabled || keptRecoveredIds.includes(file.id)}
                onClick={() => onKeepRecovered(file)}
                className="inline-flex min-h-11 cursor-pointer items-center px-2 text-xs font-semibold text-primary-dark underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default disabled:no-underline"
              >
                {keptRecoveredIds.includes(file.id)
                  ? "유지 선택됨"
                  : file.kind === "INLINE_IMAGE"
                    ? "본문에 복구"
                    : "저장에 포함"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(file)}
              className="inline-flex min-h-11 shrink-0 cursor-pointer items-center px-2 text-xs font-semibold text-primary-dark underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:text-primary"
            >
              제거
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}

async function getImageDimensions(file: File) {
  const image = await createImageBitmap(file);
  const dimensions = { width: image.width, height: image.height };
  image.close();
  return dimensions;
}

function getFallbackContentType(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "application/octet-stream";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
}
