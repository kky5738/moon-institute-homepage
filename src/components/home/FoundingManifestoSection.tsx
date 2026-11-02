import Image from "next/image";
import manifestoPage1 from "@/assets/founding1.jpg";
import manifestoPage2 from "@/assets/founding2.jpg";
import manifestoPage3 from "@/assets/founding3.jpg";
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
          <a
            href="/founding-manifesto.pdf"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="창립선언문 원문 보기 (PDF, 새 탭)"
            className="inline-flex min-h-11 items-center text-sm font-medium text-primary-dark underline underline-offset-4 hover:text-foreground"
          >
            원문 보기
          </a>
        </div>
      </div>
    </section>
  );
}
