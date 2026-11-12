import { assertAdmin, AdminUnauthorizedError } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getHomeIntroductionImage, validateHomeIntroductionId, validateStoredHomeIntroduction } from "@/lib/home-introduction-validation";
import { downloadHomeIntroductionImage } from "@/lib/supabase-storage";
import { logServerError } from "@/lib/server-log";
import sharp from "sharp";

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertAdmin();
    const { id: rawId } = await params;
    let id: string;
    try { id = validateHomeIntroductionId(rawId); }
    catch { return new Response(null, { status: 404, headers }); }
    const content = await prisma.homeIntroductionContent.findUnique({ where: { id } });
    if (!content || !content.objectPath) return new Response(null, { status: 404, headers });
    validateStoredHomeIntroduction(content);
    const image = getHomeIntroductionImage(content);
    const bytes = await downloadHomeIntroductionImage(image.objectPath!, image);
    if (new URL(_request.url).searchParams.get("preview") === "1") {
      return new Response(new Uint8Array(bytes), { headers: { ...headers, "Content-Type": image.contentType } });
    }
    const thumbnail = await sharp(bytes, { limitInputPixels: 40_000_000 }).rotate()
      .resize({ width: 256, height: 192, fit: "inside", withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
    return new Response(new Uint8Array(thumbnail), { headers: { ...headers, "Content-Type": "image/webp" } });
  } catch (error) {
    if (error instanceof AdminUnauthorizedError) return new Response(null, { status: 401, headers });
    logServerError("admin.home-introduction.image", error);
    return new Response(null, { status: 500, headers });
  }
}
