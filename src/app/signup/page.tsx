import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "회원가입",
  description: "문선명 연구소 연구자 계정 가입 신청입니다.",
};

export default function SignupPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-5 py-14">
      <Card className="rounded-none bg-surface p-6">
        <p className="text-sm font-semibold text-primary">연구자 계정</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          회원가입
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          이메일 소유 확인을 마치면 관리자 승인 대상으로 등록됩니다. 승인 후
          로그인할 수 있습니다.
        </p>

        <SignupForm />

        <p className="mt-5 text-center text-sm text-muted">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            로그인
          </Link>
        </p>
      </Card>
    </div>
  );
}
