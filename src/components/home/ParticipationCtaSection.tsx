import Link from "next/link";
import { participationCards } from "@/lib/site-content";

const cardMarkers = ["?", "+", "♡"];

export function ParticipationCtaSection() {
  return (
    <section id="contact" className="bg-background py-20 sm:py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary-dark via-primary to-accent-purple p-7 shadow-[var(--shadow-elegant)] sm:p-10 lg:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25)_0%,transparent_55%)]" />

          <div className="relative grid gap-12 lg:grid-cols-[1.08fr_1fr] lg:items-center">
            <div className="text-white">
              <span className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/72">
                <span className="h-px w-8 bg-gold" aria-hidden="true" />
                Join Us
              </span>
              <h2 className="mt-5 text-3xl font-semibold leading-tight [word-break:keep-all] sm:text-4xl lg:text-5xl">
                문의, 참여 신청, 후원 관심을 한곳에서 접수합니다
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/76 sm:text-base sm:leading-7">
                남겨주신 내용은 관리자 확인을 거쳐 연구소 운영과 향후 안내를
                위한 기록으로 관리합니다.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-primary-dark transition-colors hover:bg-gold"
                >
                  문의/참여 신청하기 <span className="ml-2" aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/about"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/40 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  연구소 소개 보기
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              {participationCards.map((card, index) => (
                <Link
                  key={card.title}
                  href="/contact"
                  className="group flex items-start gap-4 rounded-lg border border-white/15 bg-white/10 p-5 text-white backdrop-blur transition-colors hover:bg-white/15"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/15 text-lg font-semibold">
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
