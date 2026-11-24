import { lifeImageResponse } from "@/lib/life-record-images";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return lifeImageResponse((await params).id);
}
