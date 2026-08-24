import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getRequiredEnv } from "@/lib/env";
import { hasValidImageSignature, MAX_RESEARCH_FILE_SIZE } from "@/lib/research-files";

const SIGNED_URL_SECONDS = 60 * 60;

function getSettings() {
  return {
    url: getRequiredEnv("SUPABASE_URL"),
    publishableKey: getRequiredEnv("SUPABASE_PUBLISHABLE_KEY"),
    secretKey: getRequiredEnv("SUPABASE_SECRET_KEY"),
    bucket: process.env.SUPABASE_STORAGE_BUCKET || "research-files",
  };
}

function getAdminClient() {
  const { url, secretKey } = getSettings();
  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function createResearchUploadTicket(path: string) {
  const settings = getSettings();
  const { data, error } = await getAdminClient()
    .storage.from(settings.bucket)
    .createSignedUploadUrl(path);

  if (error) throw new Error("파일 업로드 주소를 만들 수 없습니다.", { cause: error });

  return {
    bucket: settings.bucket,
    path: data.path,
    token: data.token,
    supabaseUrl: settings.url,
    publishableKey: settings.publishableKey,
  };
}

export async function verifyResearchUpload(
  path: string,
  expected: { size: number; contentType: string; inlineImage: boolean },
) {
  const storage = getAdminClient().storage.from(getSettings().bucket);
  const { data, error } = await storage.info(path);

  if (error || !data) {
    throw new Error("업로드된 파일을 확인할 수 없습니다.", { cause: error });
  }

  const size = data.size ?? data.metadata?.size;
  const contentType = data.contentType ?? data.metadata?.mimetype;
  if (
    size !== expected.size ||
    size > MAX_RESEARCH_FILE_SIZE ||
    contentType !== expected.contentType
  ) {
    throw new Error("업로드된 파일 정보가 요청과 일치하지 않습니다.");
  }

  if (expected.inlineImage) {
    const { data: image, error: downloadError } = await storage.download(path);
    if (downloadError || !image) {
      throw new Error("본문 이미지를 확인할 수 없습니다.", { cause: downloadError });
    }
    const bytes = new Uint8Array(await image.slice(0, 12).arrayBuffer());
    if (!hasValidImageSignature(expected.contentType, bytes)) {
      throw new Error("이미지 파일의 실제 형식이 올바르지 않습니다.");
    }
  }
}

export async function removeResearchObjects(paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await getAdminClient()
    .storage.from(getSettings().bucket)
    .remove(paths);
  if (error) throw new Error("업로드 파일을 정리하지 못했습니다.", { cause: error });
}

export async function createResearchFileUrls(
  files: Array<{ objectPath: string; originalName: string; download: boolean }>,
) {
  if (files.length === 0) return [];
  const storage = getAdminClient().storage.from(getSettings().bucket);

  return Promise.all(
    files.map(async (file) => {
      const { data, error } = await storage.createSignedUrl(
        file.objectPath,
        SIGNED_URL_SECONDS,
        file.download ? { download: file.originalName } : undefined,
      );
      if (error) throw new Error("파일 열기 주소를 만들 수 없습니다.", { cause: error });
      return data.signedUrl;
    }),
  );
}
