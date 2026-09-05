import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ResendConfirmationForm } from "./resend-confirmation-form";

export const metadata: Metadata = { title: "인증 메일 다시 보내기" };

export default function ResendConfirmationPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-5 py-14">
      <Card className="rounded-none bg-surface p-6">
        <h1 className="text-2xl font-semibold text-foreground">인증 메일 다시 보내기</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          가입할 때 사용한 이메일을 입력해주세요. 이메일 확인을 마치면 관리자 승인 대상으로 등록됩니다.
        </p>
        <ResendConfirmationForm />
        <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-primary hover:underline">
          로그인으로 돌아가기
        </Link>
      </Card>
    </div>
  );
}
