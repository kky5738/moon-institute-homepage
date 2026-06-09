import Link from "next/link";
import { videoContentItems } from "@/lib/site-content";

const featuredVideo = videoContentItems[0];
const subVideos = videoContentItems.slice(1);

export function VideoContentSection() {
  return (
    <section id="media" className="bg-background py-20 sm:py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-purple">
              Video Archive
            </span>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-foreground [word-break:keep-all] sm:text-4xl lg:text-5xl">
              소개와 해설을 영상 콘텐츠로 확장합니다
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              영상 공개 전에는 준비 상태를 명확히 보여주고, 공개 후에는 소개
              영상과 자료 해설을 빠르게 찾을 수 있도록 구성합니다.
            </p>
          </div>
          <Link
            href="/materials"
            className="inline-flex h-11 w-fit items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-primary-dark transition-colors hover:border-accent-purple hover:bg-secondary"
          >
            전체 영상 보기
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          <article className="group overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-elegant)] lg:col-span-2">
            <div className="relative aspect-video bg-gradient-to-br from-primary-dark via-primary to-accent-purple">
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="grid h-20 w-20 place-items-center rounded-full bg-white/90 shadow-xl transition-transform group-hover:scale-105">
                  <span
                    className="ml-1 h-0 w-0 border-y-[12px] border-l-[18px] border-y-transparent border-l-primary-dark"
                    aria-hidden="true"
                  />
                </span>
              </div>
              <span className="absolute left-4 top-4 rounded-full bg-gold/90 px-3 py-1 text-xs font-semibold text-primary-dark">
                {featuredVideo.meta}
              </span>
              <span className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                {featuredVideo.length}
              </span>
            </div>
            <div className="p-6 sm:p-7 lg:p-8">
              <h3 className="text-2xl font-semibold text-foreground">
                {featuredVideo.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                {featuredVideo.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/materials"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
                >
                  영상 보기
                </Link>
                <Link
                  href="/materials"
                  className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-primary-dark transition-colors hover:bg-secondary"
                >
                  자료와 함께 보기
                </Link>
              </div>
            </div>
          </article>

          <div className="grid gap-5">
            {subVideos.map((video) => (
              <Link
                key={video.title}
                href="/materials"
                className="group flex gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-accent-purple/50 hover:shadow-[var(--shadow-soft)]"
              >
                <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary to-accent-purple">
                  <div className="absolute inset-0 grid place-items-center">
                    <span
                      className="ml-1 h-0 w-0 border-y-[8px] border-l-[12px] border-y-transparent border-l-white"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    {video.length}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-purple">
                    {video.meta}
                  </span>
                  <h3 className="mt-1 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {video.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {video.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
