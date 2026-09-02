import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function VideoContentSection() {
  return (
    <section id="media" className="scroll-mt-16 bg-background py-9 sm:py-12 lg:py-12">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10">
        <div className="mb-5 flex flex-col gap-4 lg:mb-6 lg:flex-row lg:items-end lg:justify-between lg:gap-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-purple">
              Video Archive
            </span>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold leading-tight text-foreground [word-break:keep-all] sm:text-4xl lg:text-4xl">
              소개와 해설을 영상으로 살펴봅니다
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              소개 영상과 자료 해설을 한곳에서 확인할 수 있습니다.
            </p>
          </div>
          <Link
            href="/materials"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "w-fit",
            })}
          >
            자료 아카이브
          </Link>
        </div>

        <Card className="grid min-h-56 place-items-center p-6 text-center">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              현재 등록된 영상 자료가 없습니다.
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              영상이 공개되면 이곳에서 안내해 드리겠습니다.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
