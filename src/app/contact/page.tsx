import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "문의 및 참여 신청",
  description: "문선명 연구소와 관련한 문의와 참여 신청을 접수합니다.",
};

export default function ContactPage() {
  return (
    <div className="bg-surface">
      <section className="border-b border-border bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold text-primary">
            문의 및 참여 신청
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            연구소와 관련한 연락을 남겨주세요
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
            일반 문의, 참여 신청, 후원 관심을 접수합니다. 남겨주신 내용은
            관리자만 확인하며 장기 보존을 전제로 관리합니다.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <aside className="border-t border-primary pt-6">
          <h2 className="text-xl font-semibold text-foreground">접수 유형</h2>
          <dl className="mt-6 space-y-5 text-sm leading-6 text-muted">
            <div>
              <dt className="font-semibold text-primary-dark">일반 문의</dt>
              <dd className="mt-1">홈페이지와 연구소 관련 문의</dd>
            </div>
            <div>
              <dt className="font-semibold text-primary-dark">참여 신청</dt>
              <dd className="mt-1">활동 참여 의사 전달</dd>
            </div>
            <div>
              <dt className="font-semibold text-primary-dark">후원 관심</dt>
              <dd className="mt-1">후원 안내를 받고 싶은 경우의 관심 등록</dd>
            </div>
          </dl>
        </aside>

        <Card className="bg-surface p-6 shadow-sm shadow-primary-dark/5 sm:p-8">
          <ContactForm />
        </Card>
      </section>
    </div>
  );
}
