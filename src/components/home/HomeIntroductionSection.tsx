import Image from "next/image";
import { homeIntroduction } from "@/lib/site-content";

export function HomeIntroductionSection() {
  return (
    <section id="home-introduction" className="flex min-h-[100svh] flex-col items-center justify-center gap-8 bg-black px-5 pb-12 pt-24 text-center text-white">
      <Image
        src={homeIntroduction.image}
        alt={homeIntroduction.alt}
        sizes="(max-width: 640px) 80vw, 360px"
        loading="eager"
        className="h-auto w-full max-w-[360px]"
      />
      <p className="text-xl font-semibold leading-relaxed [word-break:keep-all] sm:text-2xl">
        {homeIntroduction.message}
      </p>
    </section>
  );
}
