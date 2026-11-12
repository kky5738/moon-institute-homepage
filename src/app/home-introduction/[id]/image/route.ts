import { readCurrentHomeIntroduction } from "@/lib/home-introduction-public";
import { getHomeIntroductionImage, validateHomeIntroductionId } from "@/lib/home-introduction-validation";
import { downloadHomeIntroductionImage } from "@/lib/supabase-storage";
import { logServerError } from "@/lib/server-log";

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let id: string;
  try { id = validateHomeIntroductionId((await params).id); }
  catch { return new Response(null, { status: 404, headers }); }
  try {
    const content = await readCurrentHomeIntroduction();
    if (!content || content.id !== id || !content.objectPath) return new Response(null, { status: 404, headers });
    const image = getHomeIntroductionImage(content);
    const bytes = await downloadHomeIntroductionImage(image.objectPath!, image);
    return new Response(new Uint8Array(bytes), { headers: { ...headers, "Content-Type": image.contentType } });
  } catch {
    logServerError("home-introduction.image", new Error("현재 이미지 제공에 실패했습니다."));
    return new Response(null, { status: 503, headers });
  }
}
