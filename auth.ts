import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { validateAuthEnvironment } from "@/lib/env";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
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
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.userId === "string" ? token.userId : "";
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "RESEARCHER";
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
          };
        }

        const email = normalizeEmail(username);

        if (!isValidEmail(email) || email.length > 120) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              name: true,
              email: true,
              passwordHash: true,
              role: true,
              status: true,
            },
          });

          if (
            !user ||
            !canResearcherSignIn(user.status) ||
            !(await verifyPassword(password, user.passwordHash))
          ) {
            return null;
          }

          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          logServerError("auth.researcher.authorize", error);
        }

        return null;
      },
    }),
  ],
});
