import { redirect, unstable_rethrow } from "next/navigation";
import { auth } from "../../auth";
import { logServerError } from "@/lib/server-log";

export async function requireAdmin() {
  let session;

  try {
    session = await auth();
  } catch (error) {
    unstable_rethrow(error);
    logServerError("admin-auth.requireAdmin", error);
    throw error;
  }

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function assertAdmin() {
  let session;

  try {
    session = await auth();
  } catch (error) {
    unstable_rethrow(error);
    logServerError("admin-auth.assertAdmin", error);
    throw error;
  }

  if (!session?.user) {
    console.error("[auth-error] Unauthorized admin server action attempt.");
    throw new Error("Unauthorized");
  }

  return session;
}
