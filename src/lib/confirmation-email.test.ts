import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { isValidEmail, normalizeEmail } from "./user-auth";

test("confirmation resend validates input, preserves redirect and hides account status", async () => {
  const calls: unknown[] = [];
  const logs: unknown[] = [];
  let failure: { name: string; code: string; status: number; message: string } | null = null;
  let networkFailure = false;
  const exports: { resendConfirmation?: (form: FormData) => Promise<string> } = {};
  // Execute the real Server Action with only its external services replaced.
  const source = readFileSync("src/app/resend-confirmation/actions.ts", "utf8");
  runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports,
    require(name: string) {
      if (name === "@/lib/user-auth") return { isValidEmail, normalizeEmail };
      if (name === "@/lib/server-log") return { logServerError: (...args: unknown[]) => logs.push(args) };
      if (name === "@/lib/supabase-auth") return {
        getAuthRedirectUrl: (path: string) => `https://institute.example${path}`,
        getSupabaseAuthClient: () => ({ auth: { resend: async (input: unknown) => {
          calls.push(input);
          if (networkFailure) throw new Error("private network detail");
          return { error: failure };
        } } }),
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const resend = exports.resendConfirmation!;
  const form = new FormData();
  for (const value of ["", "invalid", `${"a".repeat(121)}@resend.dev`]) {
    form.set("email", value);
    assert.match(await resend(form), /이메일 형식/);
  }
  assert.equal(calls.length, 0);

  form.set("email", " Delivered@RESEND.DEV ");
  const neutralResponse = await resend(form);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), {
    type: "signup",
    email: "delivered@resend.dev",
    options: { emailRedirectTo: "https://institute.example/auth/confirm" },
  });
  for (const code of ["user_not_found", "email_confirmed", "over_email_send_rate_limit"]) {
    failure = { name: "AuthApiError", code, status: code.startsWith("over_") ? 429 : 400, message: "private account detail" };
    assert.equal(await resend(form), neutralResponse);
  }
  failure = { name: "AuthApiError", code: "unexpected_failure", status: 500, message: "private SMTP detail" };
  assert.match(await resend(form), /처리하지 못했습니다/);
  networkFailure = true;
  assert.match(await resend(form), /처리하지 못했습니다/);
  assert.doesNotMatch(JSON.stringify(logs), /private|delivered@/);
});
