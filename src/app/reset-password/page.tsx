import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "새 비밀번호 설정",
  description: "연구자 계정의 새 비밀번호를 설정합니다.",
};

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-5 py-14">
      <Card className="rounded-none bg-surface p-6">
        <p className="text-sm font-semibold text-primary">연구자 계정</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          새 비밀번호 설정
        </h1>
        <div className="mt-6">
          <ResetPasswordForm />
        </div>
      </Card>
    </div>
  );
}
