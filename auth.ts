import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  ADMIN_SESSION_MAX_AGE_MS,
  areAdminCredentialsValid,
  getAdminCredentialVersion,
  getCurrentAdminCredentialVersion,
  isAdminUsername,
  isValidAdminSession,
} from "@/lib/admin-credentials";
import { validateAuthEnvironment } from "@/lib/env";
import {
  clearLoginAccountThrottle,
  consumeLoginAttempt,
} from "@/lib/login-throttle";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { getSupabaseAuthClient } from "@/lib/supabase-auth";
import {
  canResearcherSignIn,
  isValidEmail,
  isLoginPassword,
  normalizeEmail,
} from "@/lib/user-auth";

validateAuthEnvironment();

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion ?? 0;
        token.adminCredentialVersion = user.adminCredentialVersion;
        token.adminExpiresAt = user.adminExpiresAt;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const adminSessionValid = isValidAdminSession(
          {
            role: typeof token.role === "string" ? token.role : undefined,
            adminCredentialVersion:
              typeof token.adminCredentialVersion === "string"
                ? token.adminCredentialVersion
                : undefined,
            adminExpiresAt:
              typeof token.adminExpiresAt === "number"
                ? token.adminExpiresAt
                : undefined,
          },
          getCurrentAdminCredentialVersion(),
        );

        session.user.id = typeof token.userId === "string" ? token.userId : "";
        session.user.role = adminSessionValid ? "ADMIN" : "RESEARCHER";
        session.user.sessionVersion =
          typeof token.sessionVersion === "number" ? token.sessionVersion : 0;
        session.user.adminSessionValid = adminSessionValid;
      }

      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "아이디 또는 이메일", type: "text" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials, request) {
        const username = credentials?.username;
        const password = credentials?.password;

        if (
          typeof username !== "string" ||
          username.length < 1 ||
          username.length > 320
        ) {
          return null;
        }

        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminUsername || !adminPassword) {
          console.error(
            "[auth-error] ADMIN_USERNAME or ADMIN_PASSWORD is missing during credentials authorize.",
          );
          return null;
        }

        const adminLogin = isAdminUsername(username, adminUsername);

        try {
          if (!(await consumeLoginAttempt(username, request))) return null;
        } catch (error) {
          logServerError("auth.login-throttle.consume", error);
          if (adminLogin) return null;
        }

        if (!isLoginPassword(password)) return null;

        if (adminLogin) {
          if (
            !areAdminCredentialsValid(
              username,
              password,
              adminUsername,
              adminPassword,
            )
          ) {
            return null;
          }

          try {
            await clearLoginAccountThrottle(username);
          } catch (error) {
            logServerError("auth.login-throttle.clear-admin", error);
            return null;
          }

          const secret = process.env.AUTH_SECRET;
          if (!secret) return null;

          return {
            id: "admin",
            name: "관리자",
            role: "ADMIN",
            sessionVersion: 0,
            adminCredentialVersion: getAdminCredentialVersion(
              adminUsername,
              adminPassword,
              secret,
            ),
            adminExpiresAt: Date.now() + ADMIN_SESSION_MAX_AGE_MS,
          };
        }

        const email = normalizeEmail(username);

        if (!isValidEmail(email) || email.length > 120) {
          return null;
        }

        try {
          const { data, error } = await getSupabaseAuthClient().auth.signInWithPassword({
            email,
            password,
          });

          if (error || !data.user?.email_confirmed_at) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { supabaseAuthId: data.user.id },
            select: {
              id: true,
              name: true,
              email: true,
              supabaseAuthId: true,
              emailVerifiedAt: true,
              sessionVersion: true,
              role: true,
              status: true,
            },
          });

          if (!user || user.email !== email) {
            return null;
          }

          const emailVerifiedAt =
            user.emailVerifiedAt ?? new Date(data.user.email_confirmed_at);

          if (!user.emailVerifiedAt) {
            await prisma.user.update({
              where: { id: user.id },
              data: { emailVerifiedAt },
            });
          }

          if (!canResearcherSignIn({ ...user, emailVerifiedAt })) return null;

          try {
            await clearLoginAccountThrottle(username);
          } catch (error) {
            logServerError("auth.login-throttle.clear-researcher", error);
          }

          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            role: user.role,
            sessionVersion: user.sessionVersion,
          };
        } catch (error) {
          logServerError("auth.researcher.authorize", error);
        }

        return null;
      },
    }),
  ],
});
