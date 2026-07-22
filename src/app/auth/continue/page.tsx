import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "../../../../auth";
import { getPostLoginPath } from "@/lib/user-auth";

export default async function ContinuePage() {
  await connection();
  const session = await auth();
  redirect(getPostLoginPath(session?.user?.role ?? null));
}
