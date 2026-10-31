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
        <div className="space-y-8 sm:space-y-12">
          {pages.map((page, index) => (
            <div key={page.src} className="relative aspect-[210/297]">
              <Image
                src={page}
                alt={`문선명 연구소 창립선언문 ${index + 1}페이지 이미지`}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
