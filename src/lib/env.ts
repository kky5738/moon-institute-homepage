import { logServerError } from "@/lib/server-log";

export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    const error = new Error(`Missing required environment variable: ${name}`);
    logServerError("env.missing-required", error, { name });
    throw error;
  }

  return value;
}

export function validateAuthEnvironment() {
  const requiredNames = ["AUTH_SECRET", "ADMIN_USERNAME", "ADMIN_PASSWORD"];

  for (const name of requiredNames) {
    getRequiredEnv(name);
  }

  if (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL && !process.env.VERCEL) {
    console.error(
      "[env-warning] AUTH_URL or NEXTAUTH_URL is not set. Set one of them in production unless the host is inferred by the deployment platform.",
    );
  }
}
