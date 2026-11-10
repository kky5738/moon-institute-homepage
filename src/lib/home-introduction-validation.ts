import { MAX_RESEARCH_FILE_SIZE } from "@/lib/research-files";

export const HOME_INTRODUCTION_GUIDANCE = "문구는 1~2문장, 최대 200자로 입력해주세요.";
export const DEFAULT_HOME_INTRODUCTION_ID = "00000000-0000-4000-8000-000000000060";

export type HomeIntroductionInput = {
  contentType: string;
  size: number;
  message: string;
  altText: string;
};

export function validateHomeIntroductionInput(input: HomeIntroductionInput) {
  const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const extension = Object.hasOwn(extensions, input?.contentType) ? extensions[input.contentType] : null;
  if (!extension) throw new Error("이미지는 JPEG, PNG, WebP만 사용할 수 있습니다.");
  if (!Number.isInteger(input.size) || input.size < 1 || input.size > MAX_RESEARCH_FILE_SIZE) {
    throw new Error("비어 있지 않은 20MiB 이하 이미지를 선택해주세요.");
  }
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const altText = typeof input.altText === "string" ? input.altText.trim() : "";
  if (!message || message.length > 200) throw new Error(HOME_INTRODUCTION_GUIDANCE);
  if (!altText || altText.length > 200) throw new Error("대체 텍스트는 필수이며 최대 200자입니다.");
  return { contentType: input.contentType, size: input.size, message, altText, extension };
}

export function validateHomeIntroductionId(id: string) {
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("유효하지 않은 콘텐츠 ID입니다.");
  }
  return id.toLowerCase();
}
