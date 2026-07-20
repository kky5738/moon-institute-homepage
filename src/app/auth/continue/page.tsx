import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "../../../../auth";

export default async function ContinuePage() {
  await connection();
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  if (session?.user?.role === "RESEARCHER") {
    redirect("/account");
  }

  redirect("/login");
}
