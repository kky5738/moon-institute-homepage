import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getRequiredEnv } from "@/lib/env";

const authOptions = {
  autoRefreshToken: false,
  persistSession: false,
  detectSessionInUrl: false,
} as const;

function getSettings() {
  return {
    url: getRequiredEnv("SUPABASE_URL"),
    publishableKey: getRequiredEnv("SUPABASE_PUBLISHABLE_KEY"),
    secretKey: getRequiredEnv("SUPABASE_SECRET_KEY"),
  };
}

export function getSupabaseAuthClient() {
  const { url, publishableKey } = getSettings();
  return createClient(url, publishableKey, { auth: authOptions });
}

export function getSupabaseAuthAdminClient() {
  const { url, secretKey } = getSettings();
  return createClient(url, secretKey, { auth: authOptions });
}

export function getAuthRedirectUrl(path: "/auth/confirm" | "/reset-password") {
  const configuredUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  const baseUrl = configuredUrl
    ? configuredUrl
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}
