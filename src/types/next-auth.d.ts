import type { DefaultSession } from "next-auth";

type AuthRole = "ADMIN" | "RESEARCHER";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: AuthRole;
    };
  }

  interface User {
    role: AuthRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: AuthRole;
  }
}
