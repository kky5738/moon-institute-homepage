export const POSTS_PER_PAGE = 10;

export function parsePageParam(value: string | string[] | undefined) {
  const page = typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function getPostPageWindow(requestedPage: number, totalItems: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / POSTS_PER_PAGE));
  const page = Math.min(Math.max(1, requestedPage), totalPages);

  return {
    page,
    totalPages,
    totalItems,
    offset: (page - 1) * POSTS_PER_PAGE,
  };
}
