import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "비밀번호 재설정",
  description: "연구자 계정 비밀번호 재설정 메일 요청입니다.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-5 py-14">
      <Card className="rounded-none bg-surface p-6">
        <p className="text-sm font-semibold text-primary">연구자 계정</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          비밀번호 재설정
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          가입한 이메일을 입력하면 재설정 안내를 보냅니다.
        </p>
        <ForgotPasswordForm />
      </Card>
    </div>
  );
}
