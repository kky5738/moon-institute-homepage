import { UserRole, UserStatus } from "@/generated/prisma/enums";
import { redirect, unstable_rethrow } from "next/navigation";
import { auth } from "../../auth";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";

const userSelect = {
  id: true,
  name: true,
  email: true,
  supabaseAuthId: true,
  role: true,
  status: true,
} as const;

export async function requireResearcher() {
  const user = await getApprovedResearcher();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function assertResearcher() {
  const user = await getApprovedResearcher();

  if (!user) {
    console.error("[auth-error] Unauthorized researcher server action attempt.");
    throw new Error("Unauthorized");
  }

  return user;
}

export async function getApprovedResearcher() {
  try {
    const session = await auth();
    const id = Number(session?.user?.id);
    const sessionVersion = session?.user?.sessionVersion;

    if (
      session?.user?.role !== "RESEARCHER" ||
      !Number.isInteger(id) ||
      id < 1 ||
      typeof sessionVersion !== "number" ||
      !Number.isInteger(sessionVersion) ||
      sessionVersion < 0
    ) {
      return null;
    }

    return await prisma.user.findFirst({
      where: {
        id,
        role: UserRole.RESEARCHER,
        status: UserStatus.APPROVED,
        sessionVersion,
        emailVerifiedAt: { not: null },
        supabaseAuthId: { not: null },
      },
      select: userSelect,
    });
  } catch (error) {
    unstable_rethrow(error);
    logServerError("researcher-auth.getApprovedResearcher", error);
    throw error;
  }
}
