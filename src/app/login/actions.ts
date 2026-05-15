"use server";

import { AuthError } from "next-auth";
import { redirect, unstable_rethrow } from "next/navigation";
import { signIn } from "../../../auth";
import { logServerError } from "@/lib/server-log";

export async function login(formData: FormData) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof AuthError) {
      logServerError("auth.login.credentials", error);
      redirect("/login?error=CredentialsSignin");
    }

    logServerError("auth.login.unexpected", error);
    throw error;
  }
}
