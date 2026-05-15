import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "문의 및 참여 신청",
  description: "문선명 연구소 출범 준비와 관련한 문의와 참여 신청을 접수합니다.",
};

export default function ContactPage() {
  return (
    <div className="bg-white">
      <section className="border-b border-neutral-200 bg-stone-50">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold text-stone-700">
            문의 및 참여 신청
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-neutral-950 sm:text-5xl">
            연구소 출범 준비와 관련한 연락을 남겨주세요
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600">
            일반 문의, 참여 신청, 후원 관심을 접수합니다. 남겨주신 내용은
            관리자만 확인하며 출범 이후에도 장기 보존을 전제로 관리합니다.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <aside className="border-t border-neutral-950 pt-6">
          <h2 className="text-xl font-semibold text-neutral-950">접수 유형</h2>
          <dl className="mt-6 space-y-5 text-sm leading-6 text-neutral-600">
            <div>
              <dt className="font-semibold text-neutral-950">일반 문의</dt>
              <dd className="mt-1">홈페이지와 연구소 출범 준비 관련 문의</dd>
            </div>
            <div>
              <dt className="font-semibold text-neutral-950">참여 신청</dt>
              <dd className="mt-1">출범 준비와 향후 활동 참여 의사 전달</dd>
            </div>
            <div>
              <dt className="font-semibold text-neutral-950">후원 관심</dt>
              <dd className="mt-1">후원 안내를 받고 싶은 경우의 관심 등록</dd>
            </div>
          </dl>
        </aside>

        <div className="border border-neutral-200 bg-white p-6 sm:p-8">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
