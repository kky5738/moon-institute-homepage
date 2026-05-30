import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "연구소 소개",
  description: "문선명 연구소의 운영 방향을 소개합니다.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
      <section className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-primary">연구소 소개</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            문선명 연구소를 소개합니다
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted">
            본 페이지는 사용자가 제공한 공식 원문이 확정되기 전까지 프로젝트
            문서에 있는 운영 방향만을 바탕으로 구성했습니다. 인물, 역사, 사상
            관련 설명은 추후 제공되는 원문을 우선해 반영합니다.
          </p>
        </div>

        <div className="border-t border-primary pt-6 lg:mt-2">
          <h2 className="text-xl font-semibold text-foreground">운영 방향</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <article className="border border-border bg-surface p-6 shadow-sm shadow-primary-dark/5">
              <h3 className="font-semibold text-primary-dark">공지와 자료 공유</h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                공지사항과 홍보자료를 관리형 게시판으로 제공하고 필요한
                정보를 지속적으로 축적합니다.
              </p>
            </article>
            <article className="border border-border bg-surface p-6 shadow-sm shadow-primary-dark/5">
              <h3 className="font-semibold text-primary-dark">문의와 참여 접수</h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                일반 문의, 참여 신청, 후원 관심을 접수하고 장기 보존을
                전제로 관리합니다.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
