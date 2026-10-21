import Link from "next/link";

export function ParticipationCtaSection() {
  return (
    <section id="contact" className="scroll-mt-16 border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-6 sm:px-6 sm:py-7 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div>
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">
            연구소에 문의하기
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted sm:text-base">
            연구소 관련 문의, 참여 신청, 후원 관심을 남겨주세요.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary lg:self-auto"
        >
          문의하기 <span className="ml-2" aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
