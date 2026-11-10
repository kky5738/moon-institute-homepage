import sharp from "sharp";
import { hasValidImageSignature, MAX_RESEARCH_FILE_SIZE } from "@/lib/research-files";

export async function inspectHomeIntroductionImage(bytes: Uint8Array, contentType: string) {
  if (!bytes.byteLength || bytes.byteLength > MAX_RESEARCH_FILE_SIZE || !hasValidImageSignature(contentType, bytes)) {
    throw new Error("이미지 파일의 실제 형식 또는 크기가 올바르지 않습니다.");
  }
  try {
    const image = sharp(bytes, { failOn: "warning", limitInputPixels: 40_000_000 });
    const metadata = await image.metadata();
    if (`image/${metadata.format === "jpeg" ? "jpeg" : metadata.format}` !== contentType || (metadata.pages ?? 1) !== 1) {
      throw new Error("Unsupported image");
    }
    // Decode all pixels and apply EXIF orientation, as browsers do when displaying photos.
    const { info } = await image.rotate().raw().toBuffer({ resolveWithObject: true });
    if (info.width < 1 || info.height < 1 || info.width > 20_000 || info.height > 20_000) {
      throw new Error("Invalid dimensions");
    }
    return { imageWidth: info.width, imageHeight: info.height };
  } catch {
    throw new Error("디코딩 가능한 단일 이미지가 필요합니다. 크기는 각 변 20,000px·총 4천만 화소 이하여야 합니다.");
  }
}
