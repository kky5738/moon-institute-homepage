import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "./actions";

export const metadata: Metadata = {
  title: "관리자 로그인",
  description: "문선명 연구소 홈페이지 관리자 로그인입니다.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-14">
      <Card className="rounded-none bg-surface p-6">
        <p className="text-sm font-semibold text-primary">관리자</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          로그인
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          등록된 단일 관리자 계정으로 접속합니다.
        </p>

        {error ? (
          <p className="mt-5 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            아이디 또는 비밀번호가 올바르지 않습니다.
          </p>
        ) : null}

        <form action={login} className="mt-6 space-y-5">
          <input type="hidden" name="redirectTo" value="/admin" />
          <div>
            <Label htmlFor="username">
              아이디
            </Label>
            <Input
              id="username"
              name="username"
              required
              autoComplete="username"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="password">
              비밀번호
            </Label>
            <Input
              id="password"
              name="password"
              required
              type="password"
              autoComplete="current-password"
              className="mt-2"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary-dark hover:bg-primary"
            size="lg"
          >
            로그인
          </Button>
        </form>
      </Card>
    </div>
  );
}
