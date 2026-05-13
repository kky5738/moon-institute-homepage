import type { Metadata } from "next";
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
      <div className="border border-neutral-200 bg-white p-6">
        <p className="text-sm font-semibold text-stone-700">관리자</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950">
          로그인
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
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
            <label
              className="block text-sm font-semibold text-neutral-900"
              htmlFor="username"
            >
              아이디
            </label>
            <input
              id="username"
              name="username"
              required
              autoComplete="username"
              className="mt-2 w-full border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold text-neutral-900"
              htmlFor="password"
            >
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              required
              type="password"
              autoComplete="current-password"
              className="mt-2 w-full border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
