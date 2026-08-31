import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { ConfirmEmail } from "./confirm-email";

export const metadata: Metadata = {
  title: "이메일 확인",
  description: "연구자 계정 이메일 소유 확인입니다.",
};

export default function ConfirmEmailPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-5 py-14">
      <Card className="rounded-none bg-surface p-6">
        <p className="text-sm font-semibold text-primary">연구자 계정</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          이메일 확인
        </h1>
        <div className="mt-6 text-sm leading-6">
          <ConfirmEmail />
        </div>
      </Card>
    </div>
  );
}
