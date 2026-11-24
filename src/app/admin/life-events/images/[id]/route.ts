import { assertAdmin, AdminUnauthorizedError } from "@/lib/admin-auth";
import { lifeImageResponse } from "@/lib/life-record-images";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await assertAdmin(); }
  catch (error) {
    if (error instanceof AdminUnauthorizedError) return new Response(null, { status: 401, headers: { "Cache-Control": "private, no-store" } });
    throw error;
  }
  return lifeImageResponse((await params).id, true);
}
