import type { HomeIntroductionInput } from "@/lib/home-introduction-validation";
import { requestHomeIntroductionUpload, confirmHomeIntroductionUpload, cancelHomeIntroductionUpload } from "@/app/admin/home-introduction/actions";

export async function uploadHomeIntroductionFile(file: File, input: HomeIntroductionInput) {
  const ticket = await requestHomeIntroductionUpload(input);
  if (!ticket.ok) throw new Error(ticket.message);
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const storage = createClient(ticket.supabaseUrl, ticket.publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }).storage.from(ticket.bucket);
    const { error } = await storage.uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: input.contentType });
    if (error) throw new Error("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
    const confirmed = await confirmHomeIntroductionUpload(ticket.id);
    if (!confirmed.ok) throw new Error(confirmed.message);
    return confirmed.id;
  } catch (error) {
    try {
      const cleanup = await cancelHomeIntroductionUpload(ticket.id);
      if (!cleanup.ok) throw new Error(cleanup.message);
    } catch {
      throw new Error("등록하지 못했습니다. 임시 파일 정리도 완료하지 못했습니다. 입력을 유지했으니 다시 시도해주세요.");
    }
    throw error;
  }
}
