import Link from "next/link";

export default function DeletionPendingPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-16">
      <h1 className="text-3xl font-semibold">탈퇴 요청을 접수했습니다</h1>
      <p className="mt-5 leading-7">
        계정 로그인은 차단됐으며, 남은 정보 삭제를 확인 중입니다.
        처리가 지연되면 <Link href="/contact" className="underline">문의하기</Link>로 알려주세요.
      </p>
    </div>
  );
}
