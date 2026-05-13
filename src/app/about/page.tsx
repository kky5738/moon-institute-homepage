import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "연구소 소개",
  description: "문선명 연구소의 출범 준비 방향과 운영 원칙을 소개합니다.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-stone-700">연구소 소개</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950">
          문선명 연구소는 출범을 준비하고 있습니다
        </h1>
        <p className="mt-6 text-lg leading-8 text-neutral-600">
          본 페이지는 사용자가 제공한 공식 원문이 확정되기 전까지 프로젝트
          문서에 있는 운영 방향만을 바탕으로 구성한 임시 소개입니다. 인물,
          역사, 사상 관련 설명은 추후 제공되는 원문을 우선해 반영합니다.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-neutral-950">운영 단계</h2>
          <div className="mt-6 space-y-5">
            <div>
              <h3 className="font-semibold text-neutral-900">출범 전</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                홍보용 홈페이지로 운영하며 공지사항, 홍보자료, 문의와 참여
                신청을 수집합니다.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">출범 이후</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                공식 연구소 홈페이지로 전환하고 연구 활동, 자료 아카이브,
                활동 보고, 후원 안내 기능을 확장합니다.
              </p>
            </div>
          </div>
        </section>

        <section className="border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-neutral-950">개발 원칙</h2>
          <ul className="mt-6 space-y-4 text-sm leading-6 text-neutral-600">
            <li>1인 개발자가 운영 가능한 단순한 구조를 우선합니다.</li>
            <li>초기에는 과도한 커뮤니티 기능보다 관리형 게시판을 둡니다.</li>
            <li>
              게시글, 문의글, 참여 신청 데이터는 장기 보존을 전제로 합니다.
            </li>
            <li>
              출범 전 콘텐츠가 출범 후 공식 홈페이지 안에서 유지되도록 URL과
              데이터 구조를 설계합니다.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
