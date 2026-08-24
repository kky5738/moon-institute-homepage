export const MAX_RESEARCH_FILE_SIZE = 20 * 1024 * 1024;
export const RESEARCH_IMAGE_MARKER_PATTERN =
  /\[\[research-image:([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\]\]/gi;

export type ResearchUploadKind = "ATTACHMENT" | "INLINE_IMAGE";

const documentTypes: Record<string, readonly string[]> = {
  pdf: ["application/pdf"],
  hwp: [
    "application/haansofthwp",
    "application/vnd.hancom.hwp",
    "application/x-hwp",
    "application/octet-stream",
  ],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

const imageTypes: Record<string, readonly string[]> = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
};

export type ResearchUploadMetadata = {
  id: string;
  kind: ResearchUploadKind;
  name: string;
  size: number;
  contentType: string;
  altText?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
};

export function validateResearchUpload(metadata: ResearchUploadMetadata) {
  if (!isUuid(metadata.id)) {
    throw new Error("유효하지 않은 파일 식별자입니다.");
  }

  const name = getSafeOriginalName(metadata.name);
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  const allowedTypes =
    metadata.kind === "INLINE_IMAGE"
      ? imageTypes[extension]
      : documentTypes[extension];
  const contentType = metadata.contentType.toLowerCase();

  if (!allowedTypes?.includes(contentType)) {
    throw new Error(
      metadata.kind === "INLINE_IMAGE"
        ? "본문 이미지는 JPEG, PNG, WebP 파일만 사용할 수 있습니다."
        : "첨부파일은 PDF, HWP, DOCX 파일만 사용할 수 있습니다.",
    );
  }

  if (!Number.isInteger(metadata.size) || metadata.size < 1) {
    throw new Error("비어 있는 파일은 업로드할 수 없습니다.");
  }

  if (metadata.size > MAX_RESEARCH_FILE_SIZE) {
    throw new Error("파일 하나의 크기는 20MB 이하여야 합니다.");
  }

  const altText = metadata.altText?.trim() || null;
  if (metadata.kind === "INLINE_IMAGE" && !altText) {
    throw new Error("본문 이미지의 대체 텍스트를 입력해주세요.");
  }
  if (altText && altText.length > 300) {
    throw new Error("이미지 대체 텍스트는 300자 이하로 입력해주세요.");
  }

  const imageWidth = normalizeImageDimension(metadata.imageWidth);
  const imageHeight = normalizeImageDimension(metadata.imageHeight);
  if (
    metadata.kind === "INLINE_IMAGE" &&
    (imageWidth === null || imageHeight === null)
  ) {
    throw new Error("이미지 크기를 확인할 수 없습니다.");
  }

  return {
    id: metadata.id.toLowerCase(),
    kind: metadata.kind,
    originalName: name,
    extension,
    contentType,
    size: metadata.size,
    altText,
    imageWidth,
    imageHeight,
  };
}

export function createResearchObjectPath(
  userId: number,
  postId: number,
  id: string,
  extension: string,
) {
  return `research/${userId}/${postId}/${id}.${extension}`;
}

export function createResearchImageMarker(id: string) {
  if (!isUuid(id)) throw new Error("유효하지 않은 이미지 식별자입니다.");
  return `[[research-image:${id.toLowerCase()}]]`;
}

export function getResearchImageIds(content: string) {
  return [...content.matchAll(RESEARCH_IMAGE_MARKER_PATTERN)].map((match) =>
    match[1].toLowerCase(),
  );
}

export function splitResearchContent(content: string) {
  const parts: Array<
    { type: "text"; value: string } | { type: "image"; id: string }
  > = [];
  let start = 0;

  for (const match of content.matchAll(RESEARCH_IMAGE_MARKER_PATTERN)) {
    const index = match.index ?? 0;
    if (index > start) parts.push({ type: "text", value: content.slice(start, index) });
    parts.push({ type: "image", id: match[1].toLowerCase() });
    start = index + match[0].length;
  }

  if (start < content.length) {
    parts.push({ type: "text", value: content.slice(start) });
  }

  return parts;
}

export function hasValidImageSignature(contentType: string, bytes: Uint8Array) {
  if (contentType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (contentType === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => bytes[index] === value,
    );
  }

  if (contentType === "image/webp") {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }

  return false;
}

export function formatResearchFileSize(size: number) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))}KB`
    : `${(size / 1024 / 1024).toFixed(1)}MB`;
}

function getSafeOriginalName(value: string) {
  const name = value.split(/[\\/]/).pop()?.trim() ?? "";
  if (!name || name.length > 255 || /[\u0000-\u001f\u007f]/.test(name)) {
    throw new Error("유효하지 않은 파일명입니다.");
  }
  return name;
}

function normalizeImageDimension(value?: number | null) {
  return Number.isInteger(value) && value! > 0 && value! <= 20_000
    ? value!
    : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
