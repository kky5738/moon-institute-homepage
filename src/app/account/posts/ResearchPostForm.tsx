"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createResearchImageMarker,
  formatResearchFileSize,
  getResearchImageIds,
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
};

type PendingFile = ExistingFile & {
  file: File;
  contentType: string;
  imageWidth: number | null;
  imageHeight: number | null;
};

type ResearchPostFormProps = {
  post?: {
    id: number;
    title: string;
    summary: string | null;
    content: string;
    attachments: ExistingFile[];
  };
};

export function ResearchPostForm({ post }: ResearchPostFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [postId, setPostId] = useState(post?.id ?? null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [imageAlt, setImageAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const visibleExisting =
    post?.attachments.filter((file) => !removedIds.includes(file.id)) ?? [];

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

  function removeFile(file: ExistingFile) {
    setPendingFiles((files) => files.filter((item) => item.id !== file.id));
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
    setBusy(true);
    setError("");

    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const formData = new FormData(event.currentTarget);
    formData.set("intent", submitter?.value === "draft" ? "draft" : "publish");
    if (postId) formData.set("id", String(postId));

    try {
      const prepared = await prepareResearchPost(formData);
      if (!prepared.ok) throw new Error(prepared.message);
      setPostId(prepared.postId);
      formData.set("id", String(prepared.postId));

      const imageIds = new Set(
        getResearchImageIds(String(formData.get("content") ?? "")),
      );
      const uploads = pendingFiles.filter(
        (file) => file.kind === "ATTACHMENT" || imageIds.has(file.id),
      );

      for (const pending of uploads) {
        setStatus(`${pending.originalName} 업로드 중`);
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
          await discardResearchUpload(pending.id);
          throw new Error(`${pending.originalName} 업로드에 실패했습니다.`);
        }

        const confirmed = await confirmResearchUpload(pending.id);
        if (!confirmed.ok) {
          await discardResearchUpload(pending.id);
          throw new Error(confirmed.message);
        }
        setPendingFiles((files) => files.filter((file) => file.id !== pending.id));
      }

      setStatus("게시글 저장 중");
      const saved = await saveResearchPost(formData);
      if (!saved.ok) throw new Error(saved.message);
      router.push(saved.redirectTo);
      router.refresh();
    } catch (cause) {
      setError(getErrorMessage(cause));
      setStatus(postId ? "다시 저장할 수 있습니다." : "초안으로 보관했습니다.");
      setBusy(false);
    }
  }

  const allFiles = [...visibleExisting, ...pendingFiles];
  const attachments = allFiles.filter((file) => file.kind === "ATTACHMENT");
  const inlineImages = allFiles.filter((file) => file.kind === "INLINE_IMAGE");

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-8 space-y-7">
      {postId ? <input type="hidden" name="id" value={postId} /> : null}
      {removedIds.map((id) => (
        <input key={id} type="hidden" name="removedAttachmentId" value={id} />
      ))}

      <FormField label="제목" htmlFor="title">
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={post?.title}
          className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </FormField>

      <FormField label="요약" htmlFor="summary">
        <textarea
          id="summary"
          name="summary"
          rows={3}
          maxLength={500}
          defaultValue={post?.summary ?? ""}
          className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </FormField>

      <FormField label="본문" htmlFor="content">
        <textarea
          ref={contentRef}
          id="content"
          name="content"
          rows={18}
          required
          maxLength={100_000}
          defaultValue={post?.content}
          className="mt-2 w-full border border-border bg-surface px-3 py-3 text-sm leading-7 outline-none focus:border-primary"
        />
      </FormField>

      <fieldset className="border border-border bg-background p-4 sm:p-5">
        <legend className="px-2 text-sm font-semibold text-foreground">
          본문 이미지
        </legend>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <FormField label="이미지" htmlFor="inline-image">
            <input
              ref={imageInputRef}
              id="inline-image"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="mt-2 block w-full text-sm text-muted file:mr-3 file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-sm file:font-semibold"
            />
          </FormField>
          <FormField label="이미지 설명" htmlFor="inline-image-alt">
            <input
              id="inline-image-alt"
              value={imageAlt}
              onChange={(event) => setImageAlt(event.target.value)}
              maxLength={300}
              placeholder="이미지의 내용을 설명해주세요"
              className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </FormField>
          <Button type="button" variant="outline" onClick={addInlineImage}>
            현재 위치에 삽입
          </Button>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          JPEG, PNG, WebP · 파일당 최대 20MB. 미리보기 없이 본문의 현재 커서
          위치에 이미지 표식을 넣습니다.
        </p>
        <FileList files={inlineImages} onRemove={removeFile} />
      </fieldset>

      <fieldset className="border border-border bg-background p-4 sm:p-5">
        <legend className="px-2 text-sm font-semibold text-foreground">첨부파일</legend>
        <input
          type="file"
          multiple
          accept=".pdf,.hwp,.docx,application/pdf,application/x-hwp,application/haansofthwp,application/vnd.hancom.hwp,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => {
            addAttachments(event.target.files);
            event.currentTarget.value = "";
          }}
          className="block w-full text-sm text-muted file:mr-3 file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-sm file:font-semibold"
        />
        <p className="mt-3 text-xs leading-5 text-muted">
          PDF, HWP, DOCX · 파일당 최대 20MB
        </p>
        <FileList files={attachments} onRemove={removeFile} />
      </fieldset>

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

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-6">
        <Link
          href="/account/posts"
          className="inline-flex h-11 items-center border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:border-accent"
        >
          취소
        </Link>
        <Button
          type="submit"
          name="intent"
          value="draft"
          variant="outline"
          formNoValidate
          disabled={busy}
        >
          {busy ? "저장 중" : "임시저장"}
        </Button>
        <Button type="submit" name="intent" value="publish" disabled={busy}>
          {busy ? "처리 중" : post ? "저장 후 공개" : "공개하기"}
        </Button>
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
  onRemove,
}: {
  files: ExistingFile[];
  onRemove: (file: ExistingFile) => void;
}) {
  if (files.length === 0) return null;
  return (
    <ul className="mt-4 divide-y divide-border border-y border-border text-sm">
      {files.map((file) => (
        <li key={file.id} className="flex items-center justify-between gap-3 py-3">
          <span className="min-w-0 truncate">
            {file.originalName} · {formatResearchFileSize(file.size)}
          </span>
          <button
            type="button"
            onClick={() => onRemove(file)}
            className="shrink-0 font-semibold text-primary-dark underline-offset-4 hover:underline"
          >
            제거
          </button>
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
