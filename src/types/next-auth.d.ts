import type { DefaultSession } from "next-auth";

type AuthRole = "ADMIN" | "RESEARCHER";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: AuthRole;
      sessionVersion: number;
      adminSessionValid?: boolean;
    };
  }

  interface User {
    role: AuthRole;
    sessionVersion?: number;
    adminCredentialVersion?: string;
    adminExpiresAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: AuthRole;
    sessionVersion?: number;
    adminCredentialVersion?: string;
    adminExpiresAt?: number;
  }
}
