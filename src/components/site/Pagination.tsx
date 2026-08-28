import Link from "next/link";

export function Pagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const className =
    "inline-flex min-h-11 items-center justify-center border border-border bg-surface px-4 text-sm font-semibold text-primary-dark hover:border-primary hover:text-foreground";
  const disabledClassName =
    "inline-flex min-h-11 items-center justify-center border border-border px-4 text-sm text-muted opacity-50";

  return (
    <nav
      aria-label="페이지 이동"
      className="mt-8 flex items-center justify-center gap-3"
    >
      {page > 1 ? (
        <Link href={pageHref(basePath, page - 1)} className={className}>
          이전
        </Link>
      ) : (
        <span className={disabledClassName} aria-disabled="true">
          이전
        </span>
      )}
      <span className="min-w-20 text-center text-sm text-muted" aria-current="page">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={pageHref(basePath, page + 1)} className={className}>
          다음
        </Link>
      ) : (
        <span className={disabledClassName} aria-disabled="true">
          다음
        </span>
      )}
    </nav>
  );
}

function pageHref(basePath: string, page: number) {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}
