export async function completeAccountDeletion(
  deleteAuthUser: () => Promise<{ error: { status?: number; code?: string } | null }>,
  deleteDatabaseUser: () => Promise<void>,
) {
  const { error } = await deleteAuthUser();
  if (error && !(error.status === 404 && error.code === "user_not_found")) {
    throw new Error("Supabase Auth user deletion failed.", { cause: error });
  }
  await deleteDatabaseUser();
}
