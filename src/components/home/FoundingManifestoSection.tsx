import Image from "next/image";
import manifestoPage1 from "@/assets/founding-manifesto1.jpeg";
import manifestoPage2 from "@/assets/founding-manifesto2.jpeg";
import manifestoPage3 from "@/assets/founding-manifesto3.jpeg";
import styles from "./HomeSectionTransitions.module.css";

const pages = [manifestoPage1, manifestoPage2, manifestoPage3];

export function FoundingManifestoSection() {
  return (
    <section id="founding-manifesto" tabIndex={-1} aria-label="문선명 연구소 창립선언문" className={`${styles.manifesto} scroll-mt-16 bg-[#f6f4ed] px-5 pb-16 sm:pb-20`}>
      <div className={`${styles.enter} mx-auto max-w-[720px]`}>
        <div>
          {pages.map((page, index) => (
            <div key={page.src} className="relative aspect-[793/1122]">
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
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {pages.map((page, index) => (
            <a
              key={page.src}
              href={page.src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-sm font-medium text-primary-dark underline underline-offset-4 hover:text-foreground"
            >
              {index + 1}페이지 원본 크게 보기 (새 탭)
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
