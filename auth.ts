import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { validateAuthEnvironment } from "@/lib/env";
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
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.userId === "string" ? token.userId : "";
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "RESEARCHER";
        session.user.sessionVersion =
          typeof token.sessionVersion === "number" ? token.sessionVersion : 0;
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
      async authorize(credentials) {
        const username = credentials?.username;
        const password = credentials?.password;

        if (typeof username !== "string" || !isLoginPassword(password)) {
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

        if (username === adminUsername && password === adminPassword) {
          return {
            id: "admin",
            name: "관리자",
            role: "ADMIN",
            sessionVersion: 0,
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
