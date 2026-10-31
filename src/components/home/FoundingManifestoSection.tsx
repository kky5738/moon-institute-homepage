import Image from "next/image";
import manifestoPage1 from "@/assets/founding-manifesto1.jpeg";
import manifestoPage2 from "@/assets/founding-manifesto2.jpeg";
import manifestoPage3 from "@/assets/founding-manifesto3.jpeg";

const pages = [manifestoPage1, manifestoPage2, manifestoPage3];

export function FoundingManifestoSection() {
  return (
    <section aria-labelledby="founding-manifesto-title" className="bg-[#f6f4ed] px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-[720px]">
        <h2 id="founding-manifesto-title" className="mb-10 text-center text-2xl font-semibold text-primary-dark sm:text-3xl">
          문선명 연구소 창립선언문
        </h2>
        <p className="mb-8 text-center text-sm leading-6 text-foreground">
          원본 이미지는 793×1122픽셀이므로 확대 시 선명도에 한계가 있습니다.
          이미지의 대체 설명은 본문 전체를 대신하지 않습니다.
        </p>
        <div className="space-y-8 sm:space-y-12">
          {pages.map((page, index) => (
            <div key={page.src}>
              <div className="relative aspect-[210/297]">
                <Image
                  src={page}
                  alt={`문선명 연구소 창립선언문 ${index + 1}페이지 이미지`}
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <a
                href={page.src}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary-dark underline underline-offset-4 hover:text-foreground"
              >
                {index + 1}페이지 원본 크게 보기 (새 탭)
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
