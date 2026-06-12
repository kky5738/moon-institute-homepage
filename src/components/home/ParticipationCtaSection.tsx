import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { participationCards } from "@/lib/site-content";

const cardMarkers = ["?", "+", "♡"];

export function ParticipationCtaSection() {
  return (
    <section id="contact" className="scroll-mt-16 bg-background py-12 sm:py-16 lg:py-16 xl:py-20">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary-dark via-primary to-accent-purple p-5 shadow-[var(--shadow-elegant)] sm:p-8 lg:p-10 xl:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25)_0%,transparent_55%)]" />

          <div className="relative grid gap-8 lg:grid-cols-[1.08fr_1fr] lg:items-center">
            <div className="text-white">
              <span className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/72">
                <span className="h-px w-8 bg-gold" aria-hidden="true" />
                Join Us
              </span>
              <h2 className="mt-4 text-2xl font-semibold leading-tight [word-break:keep-all] sm:text-4xl lg:text-5xl">
                문의, 참여 신청, 후원 관심을 한곳에서 접수합니다
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/76 sm:text-base sm:leading-7">
                남겨주신 내용은 관리자 확인을 거쳐 연구소 운영과 향후 안내를
                위한 기록으로 관리합니다.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className={buttonVariants({
                    variant: "inverse",
                    size: "xl",
                    className: "h-11 sm:h-12",
                  })}
                >
                  문의/참여 신청하기 <span className="ml-2" aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/about"
                  className={buttonVariants({
                    variant: "inverseOutline",
                    size: "xl",
                    className: "h-11 sm:h-12",
                  })}
                >
                  연구소 소개 보기
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              {participationCards.map((card, index) => (
                <Card
                  key={card.title}
                  className="group border-white/15 bg-white/10 p-0 text-white backdrop-blur transition-colors hover:bg-white/15"
                >
                  <Link href="/contact" className="flex items-start gap-4 p-4 sm:p-5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/15 text-lg font-semibold sm:h-11 sm:w-11">
                      {cardMarkers[index]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold">{card.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-white/70">
                        {card.description}
                      </span>
                    </span>
                    <span className="mt-2 text-white/50 transition-all group-hover:translate-x-0.5 group-hover:text-white">
                      →
                    </span>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
