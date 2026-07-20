import type { Metadata } from "next";
import { connection } from "next/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireResearcher } from "@/lib/researcher-auth";
import { deleteAccount, logout } from "./actions";

export const metadata: Metadata = {
  title: "내 계정",
  description: "문선명 연구소 연구자 계정 정보입니다.",
};

export default async function AccountPage() {
  await connection();
  const user = await requireResearcher();

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-14">
      <div className="border-b border-border pb-8">
        <p className="text-sm font-semibold text-primary">연구자 계정</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          내 계정
        </h1>
      </div>

      <Card className="mt-8 rounded-none bg-surface p-6">
        <dl className="grid gap-5 text-sm sm:grid-cols-[120px_1fr]">
          <dt className="font-semibold text-foreground">이름</dt>
          <dd className="text-muted">{user.name}</dd>
          <dt className="font-semibold text-foreground">이메일</dt>
          <dd className="break-all text-muted">{user.email}</dd>
          <dt className="font-semibold text-foreground">상태</dt>
          <dd className="text-muted">승인됨</dd>
        </dl>

        <form action={logout} className="mt-6 border-t border-border pt-6">
          <Button type="submit" variant="outline">
            로그아웃
          </Button>
        </form>
      </Card>

      <Card className="mt-6 rounded-none border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">회원 탈퇴</h2>
        <p className="mt-3 text-sm leading-6 text-red-800">
          탈퇴하면 이름, 이메일, 비밀번호 해시와 계정 상태가 즉시 삭제되며
          복구할 수 없습니다.
        </p>
        <form action={deleteAccount} className="mt-4">
          <label className="flex items-start gap-2 text-sm font-medium text-red-900">
            <input
              type="checkbox"
              name="confirm"
              value="yes"
              required
              className="mt-1"
            />
            <span>계정을 영구 삭제하고 탈퇴하는 데 동의합니다.</span>
          </label>
          <Button
            type="submit"
            className="mt-4 bg-red-700 text-white hover:bg-red-800"
          >
            회원 탈퇴
          </Button>
        </form>
      </Card>
    </div>
  );
}
