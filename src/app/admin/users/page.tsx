import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Pagination } from "@/components/site/Pagination";
import { PendingButton } from "@/components/ui/pending-button";
import { UserStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getPostPageWindow,
  parsePageParam,
  POSTS_PER_PAGE,
} from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { retryAccountDeletion, updateUserStatus } from "./actions";

export const metadata: Metadata = {
  title: "회원 관리",
  description: "연구자 가입 신청과 계정 상태를 관리합니다.",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; status?: string }>;
}) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const requestedPage = parsePageParam(params.page);
  const pendingOnly = params.status === "deletion";
  const { users, page, totalPages, pendingCount } = await getAdminUserPage(requestedPage, pendingOnly);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8">
      <div className="border-b border-border pb-8">
        <p className="text-sm font-semibold text-primary">관리자</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          회원 관리
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          이메일 확인이 끝난 신청만 승인할 수 있습니다. 비활성화하면 기존
          연구자 세션과 로그인을 이용할 수 없습니다.
        </p>
        {pendingOnly || pendingCount > 0 ? (
          <Link
            href={pendingOnly ? "/admin/users" : "/admin/users?status=deletion"}
            className="mt-4 inline-block text-sm font-semibold text-primary underline"
          >
            {pendingOnly ? "전체 회원 보기" : `탈퇴 처리 중 ${pendingCount}건 보기`}
          </Link>
        ) : null}
      </div>

      <section className="mt-8 divide-y divide-border border-y border-border bg-surface">
        {users.length > 0 ? (
          users.map((user) => (
            <article
              key={user.id}
              className="grid gap-5 px-5 py-5 md:grid-cols-[1fr_190px_220px] md:px-6"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-foreground">
                    {user.status === UserStatus.DELETION_PENDING ? `회원 #${user.id}` : user.name}
                  </h2>
                  <span className="border border-border px-2 py-1 text-xs font-semibold text-muted">
                    {getStatusLabel(user.status)}
                  </span>
                </div>
                {user.status !== UserStatus.DELETION_PENDING ? (
                  <p className="mt-2 break-all text-sm text-muted">{user.email}</p>
                ) : null}
              </div>

              <dl className="space-y-1 text-xs leading-5 text-muted">
                <div>
                  <dt className="inline font-semibold">신청: </dt>
                  <dd className="inline">{formatDate(user.createdAt)}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">이메일 확인: </dt>
                  <dd className="inline">
                    {user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : "미확인"}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold">상태 변경: </dt>
                  <dd className="inline">{formatDate(user.statusChangedAt)}</dd>
                </div>
              </dl>

              <StatusButtons
                id={user.id}
                status={user.status}
                emailVerified={Boolean(user.emailVerifiedAt)}
              />
            </article>
          ))
        ) : (
          <div className="px-5 py-10 text-sm text-muted md:px-6">
            {pendingOnly ? "탈퇴 처리 중인 회원이 없습니다." : "가입 신청이 없습니다."}
          </div>
        )}
      </section>
      <Pagination basePath={pendingOnly ? "/admin/users?status=deletion" : "/admin/users"} page={page} totalPages={totalPages} />
    </div>
  );
}

async function getAdminUserPage(requestedPage: number, pendingOnly: boolean) {
  try {
    const where = pendingOnly ? { status: UserStatus.DELETION_PENDING } : {};
    const [totalItems, pendingCount] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { status: UserStatus.DELETION_PENDING } }),
    ]);
    const pagination = getPostPageWindow(requestedPage, totalItems);
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerifiedAt: true,
        status: true,
        statusChangedAt: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.offset,
      take: POSTS_PER_PAGE,
    });

    return { ...pagination, users, pendingCount };
  } catch (error) {
    logServerError("admin.users.list", error);
    throw error;
  }
}

function StatusButtons({
  id,
  status,
  emailVerified,
}: {
  id: number;
  status: UserStatus;
  emailVerified: boolean;
}) {
  const canApprove = status !== UserStatus.APPROVED && emailVerified;
  const canDisable = status !== UserStatus.DISABLED;

  if (status === UserStatus.DELETION_PENDING) {
    return (
      <form action={retryAccountDeletion} className="flex md:justify-end">
        <input type="hidden" name="id" value={id} />
        <PendingButton
          pendingLabel="삭제 재시도 중…"
          className="border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary-dark hover:border-primary"
        >
          삭제 재시도
        </PendingButton>
      </form>
    );
  }

  if (!canApprove && !canDisable) {
    return (
      <div className="flex flex-wrap items-start gap-2 md:justify-end">
        <span className="px-3 py-1.5 text-xs font-semibold text-muted">
          이메일 확인 대기
        </span>
      </div>
    );
  }

  return (
    <form
      action={updateUserStatus}
      className="flex flex-wrap items-start gap-2 md:justify-end"
    >
      <input type="hidden" name="id" value={id} />
      {canApprove ? (
        <PendingButton
          name="status"
          value={UserStatus.APPROVED}
          pendingLabel="승인 중…"
          className="border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary-dark hover:border-primary hover:text-foreground disabled:hover:border-border disabled:hover:text-primary-dark"
        >
          승인
        </PendingButton>
      ) : null}
      {canDisable ? (
        <PendingButton
          name="status"
          value={UserStatus.DISABLED}
          pendingLabel="비활성화 중…"
          className="border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary-dark hover:border-primary hover:text-foreground disabled:hover:border-border disabled:hover:text-primary-dark"
        >
          비활성화
        </PendingButton>
      ) : null}
    </form>
  );
}

function getStatusLabel(status: UserStatus) {
  if (status === UserStatus.PENDING) {
    return "승인 대기";
  }

  if (status === UserStatus.APPROVED) {
    return "승인됨";
  }

  if (status === UserStatus.DELETION_PENDING) {
    return "탈퇴 처리 중";
  }

  return "비활성화";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}
