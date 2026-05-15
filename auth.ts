import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { validateAuthEnvironment } from "@/lib/env";

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
  providers: [
    Credentials({
      credentials: {
        username: { label: "아이디", type: "text" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username;
        const password = credentials?.password;

        if (typeof username !== "string" || typeof password !== "string") {
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

        if (
          username === adminUsername &&
          password === adminPassword
        ) {
          return {
            id: "admin",
            name: "관리자",
          };
        }

        return null;
      },
    }),
  ],
});
