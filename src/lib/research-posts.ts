export function canEditResearchPost(
  userId: number | null,
  authorId: number | null,
) {
  return userId !== null && userId === authorId;
}
