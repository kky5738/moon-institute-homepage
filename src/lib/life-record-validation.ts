export const LIFE_RECORD_CACHE_TAG = "life-records";
export const MAX_HOME_LIFE_RECORDS = 9;

export class LifeRecordValidationError extends Error {}

export function lifeRecordId(value: unknown) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new LifeRecordValidationError("유효하지 않은 사건 또는 사진입니다.");
  }
  return value.toLowerCase();
}

function text(form: FormData, name: string, label: string, max: number) {
  const raw = form.get(name);
  if (raw !== null && typeof raw !== "string") throw new LifeRecordValidationError(`${label}을 확인해주세요.`);
  const value = (raw ?? "").trim();
  if (value.length > max) throw new LifeRecordValidationError(`${label}은 ${max.toLocaleString()}자 이하로 입력해주세요.`);
  return value;
}

export function parseLifeRecordForm(form: FormData) {
  const title = text(form, "title", "제목", 160);
  if (!title) throw new LifeRecordValidationError("제목을 입력해주세요.");
  const rawYear = text(form, "year", "연도", 4);
  const year = rawYear ? Number(rawYear) : null;
  if (year !== null && (!/^\d{4}$/.test(rawYear) || year < 1000 || year > 9999)) {
    throw new LifeRecordValidationError("연도는 네 자리 숫자로 입력해주세요.");
  }
  const dateLabel = text(form, "dateLabel", "날짜 표기", 100);
  const summary = text(form, "summary", "짧은 설명", 200);
  const content = text(form, "content", "상세 내용", 100_000);
  const source = text(form, "source", "출처", 2000);
  const imageAlt = text(form, "imageAlt", "사진 설명", 300);
  const rawImageId = text(form, "coverImageId", "사진", 36);
  const coverImageId = rawImageId ? lifeRecordId(rawImageId) : null;
  const rawOrder = text(form, "sortOrder", "표시 순서", 6) || "0";
  if (!/^\d{1,6}$/.test(rawOrder)) throw new LifeRecordValidationError("표시 순서는 0 이상의 정수로 입력해주세요.");
  const intent = form.get("intent");
  if (intent !== "draft" && intent !== "publish" && intent !== "archive") throw new LifeRecordValidationError("저장 방식을 선택해주세요.");
  const status: "PUBLISHED" | "ARCHIVED" | "DRAFT" = intent === "publish" ? "PUBLISHED" : intent === "archive" ? "ARCHIVED" : "DRAFT";
  const featured = form.get("featured") === "on";
  if (status === "PUBLISHED" && (year === null || !summary || !content)) {
    throw new LifeRecordValidationError("공개하려면 연도, 짧은 설명, 상세 내용을 입력해주세요.");
  }
  if (coverImageId && !imageAlt) throw new LifeRecordValidationError("사진의 대체 설명을 입력해주세요.");
  if (status === "PUBLISHED" && featured && !coverImageId) {
    throw new LifeRecordValidationError("홈에 소개할 사건에는 대표 사진을 등록해주세요.");
  }
  return { title, year, dateLabel, summary, content, source, imageAlt, coverImageId, sortOrder: Number(rawOrder), status, featured };
}

export type LifeRecordFields = ReturnType<typeof parseLifeRecordForm>;

export function parseLifeRecordSearch(params: { q?: string | string[]; year?: string | string[] }) {
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const year = typeof params.year === "string" && /^\d{4}$/.test(params.year) && Number(params.year) >= 1000
    ? Number(params.year) : null;
  return { q, year };
}

export function lifeRecordSearchPath(base: string, search: ReturnType<typeof parseLifeRecordSearch>) {
  const params = new URLSearchParams();
  if (search.q) params.set("q", search.q);
  if (search.year) params.set("year", String(search.year));
  return `${base}${params.size ? `?${params}` : ""}`;
}
