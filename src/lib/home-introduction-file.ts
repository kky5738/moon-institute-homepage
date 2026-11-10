import { validateHomeIntroductionInput } from "@/lib/home-introduction-validation";

// The caller owns the returned preview URL and must revoke it on replacement/unmount.
export async function readHomeIntroductionFile(file: File) {
  validateHomeIntroductionInput({ contentType: file.type, size: file.size, message: "미리보기", altText: "미리보기" });
  const previewUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = previewUrl;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > 20_000 || image.naturalHeight > 20_000 || image.naturalWidth * image.naturalHeight > 40_000_000) {
      throw new Error("이미지 크기를 확인해주세요. 각 변 20,000px·총 4천만 화소 이하여야 합니다.");
    }
    return { previewUrl, imageWidth: image.naturalWidth, imageHeight: image.naturalHeight };
  } catch (error) {
    URL.revokeObjectURL(previewUrl);
    throw error;
  }
}
