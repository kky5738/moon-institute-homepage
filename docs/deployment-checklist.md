# Vercel 배포 체크리스트

> 현재 Vercel에 배포하고 Supabase PostgreSQL을 사용한다. `main` 브랜치는 Production, 다른 브랜치는 Preview 배포로 사용 중이며 실제 Vercel Project Settings와 일치하는지 최종 확인한다.

## 1. Repository Readiness

- Keep `.env` and all real secrets out of Git. This project ignores `.env*`.
- Commit `.env.example` only with placeholder values.
- Confirm `.gitignore` keeps `.env`, `.env.local`, `.env.production`, and `.vercel` out of Git.
- Confirm `src/generated/prisma` is generated during install and is not required to be committed.
- Confirm the build works locally:

```bash
npm install
npm run lint
npm run build
```

## 2. Vercel Project Settings

- Import the Git repository into Vercel as a Next.js project.
- Confirm the Production Branch is `main`; pushes to other branches should create Preview deployments.
- Use the default Vercel build command:

```bash
npm run build
```

- No custom `vercel.json` is required for the current MVP.
- Confirm Node.js version support in Vercel if the local/runtime version changes later.
- Leave the runtime as the default Node.js/serverless runtime. Do not move Prisma-backed routes to Edge runtime unless the database driver and adapter are explicitly changed for Edge.

## 3. Environment Variables

현재 애플리케이션 실행에 필요한 값을 Vercel Project Settings의 Production과 Preview에 각각 설정한다.

```bash
DATABASE_URL=
AUTH_SECRET=
ADMIN_USERNAME=
ADMIN_PASSWORD=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_STORAGE_BUCKET=research-files
```

호스트 추론이 되지 않을 때만 다음 값을 추가한다.

```bash
AUTH_URL=
```

Notes:

- `DATABASE_URL` must point to an external PostgreSQL database, not local Docker.
- Prefer a pooled/serverless-safe PostgreSQL connection string from the provider.
- `AUTH_SECRET` must be a cryptographically secure random string. Generate one with:

```bash
npm exec auth secret
```

- `AUTH_URL` is usually optional on Vercel, but setting it to the production custom domain is acceptable.
- `AUTH_TRUST_HOST` is usually inferred on Vercel. Set `AUTH_TRUST_HOST=true` if deploying behind a proxy in a future AWS/self-hosted setup and Auth.js cannot infer trusted forwarded headers.
- Use different admin passwords for Preview and Production if Preview is publicly accessible.
- Do not prefix any secret with `NEXT_PUBLIC_`; that would expose it to the browser bundle.
- Keep `SUPABASE_SECRET_KEY` server-only. `SUPABASE_PUBLISHABLE_KEY` is returned only with a short-lived signed upload token after the existing researcher authorization check.
- Create `research-files` as a private Storage bucket with a 20MiB per-file limit and the MIME allowlist documented in `READY-18` before enabling uploads.
- After changing any Vercel environment variable, redeploy. Existing deployments do not automatically receive updated values.
- If a required variable is missing, Vercel Runtime Logs should contain `[server-error] env.missing-required` with the missing variable name.
- For Auth.js compatibility, this project uses the current `AUTH_*` naming. If older docs or tools mention `NEXTAUTH_URL`, treat it as an alias for `AUTH_URL`; do not set conflicting values.

## 4. PostgreSQL Provider

The current provider is Supabase PostgreSQL.

Before first production deploy:

- Confirm the existing Supabase project is the intended Production database.
- Copy the Supabase PostgreSQL connection string into `DATABASE_URL`.
- Ensure SSL is enabled when the provider requires it, usually with `sslmode=require`.
- For Preview deployments, use a separate preview database if migrations may differ from Production.
- Confirm the database connection limit is compatible with serverless traffic. Use provider pooling, RDS Proxy, or an equivalent pooler when needed.
- Confirm the Supabase plan and available retention in Database > Backups. Free projects should not be treated as having the same daily backup guarantees as paid plans.
- Document the restore path and test it before relying on the default backup settings for official operation.

## 5. Prisma

This project uses:

- `@prisma/adapter-pg`
- Prisma Client generated into `src/generated/prisma`
- `engineType = "client"` for a lighter serverless-compatible client

The `postinstall` script runs `prisma generate` during Vercel installs so the generated client stays in sync with `prisma/schema.prisma`.

`prisma` is kept in `dependencies` so `postinstall` can run on Vercel even when dev dependencies are not installed in the same way as local development.

Apply migrations to the external database before or during release:

```bash
npm run db:deploy
```

For initial sample data only:

```bash
npm run db:seed
```

Do not run `prisma migrate dev` against Production.

Current production rendering notes:

- Public DB-backed pages call `connection()` before database reads so `next build` does not need the production database contents to prerender them.
- Detail pages are dynamic route segments and read the database at request time.
- Admin pages are dynamic because they read the Auth.js session and/or database.
- Empty `posts` results render empty-state UI instead of throwing.
- Missing active `categories` on `/admin/posts/new` disables post creation and shows an admin-facing message.
- Unexpected Prisma errors are logged with `[server-error] posts.*` or `[server-error] admin.posts.*` before being re-thrown to the error boundary.
- If public pages log `P2021` or `The table public.posts does not exist`, production migrations have not been applied. Run `npm run db:deploy` against the deployment database.

## 6. Auth

Application boundary:

- The single administrator still uses Auth.js and `ADMIN_USERNAME`/`ADMIN_PASSWORD`; researcher email ownership and passwords use Supabase Auth.
- Administrator sessions expire after one hour and are rejected immediately after `ADMIN_USERNAME` or `ADMIN_PASSWORD` changes.
- Login attempts require the `20260902000000_add_login_throttles` migration. The application limits accounts to 5 attempts and Vercel client IPs to 20 attempts per 15 minutes, then locks them for 15 minutes.
- A researcher needs both a confirmed Supabase email and application `User.status = APPROVED`. The administrator cannot approve an unconfirmed email.
- Password reset increments `User.sessionVersion`, so existing Auth.js researcher sessions stop authorizing on their next request.
- `/admin`, researcher mutations, and resource ownership checks remain enforced server-side.
- Keep `SUPABASE_SECRET_KEY`, SMTP credentials, Auth tokens, passwords, and complete confirmation/reset links out of browser code and logs.

Supabase Dashboard setup before an environment is enabled:

1. In Authentication > Providers > Email, enable email/password sign-up and turn **Confirm email** on. Keep the application and Dashboard minimum password length at 15 or stricter.
2. In Authentication > URL Configuration, set Site URL to the exact current deployment origin. Add only the exact `/auth/confirm` and `/reset-password` URLs for that origin; do not use a Production wildcard. Add exact localhost URLs only to a development project.
3. In Authentication > Email Templates, set the confirmation link to `<a href="{{ .RedirectTo }}#token_hash={{ .TokenHash }}&amp;type=email">이메일 확인</a>` and the recovery link to `<a href="{{ .RedirectTo }}#token_hash={{ .TokenHash }}&amp;type=recovery">비밀번호 재설정</a>`.
4. In Authentication > SMTP Settings, use the connected Resend SMTP sender (`smtp.resend.com`, port `465`, username `resend`, password managed by the Resend integration). The sender must use the Resend-verified domain. Supabase sends authentication emails itself; installing the Resend Node.js SDK or adding `RESEND_API_KEY` to the Next.js application is not required for this SMTP integration. Do not copy SMTP credentials into the repository.
5. In Authentication settings, set email OTP/link expiry to 1,800 seconds. In Authentication > Rate Limits, verify the 60-second per-user signup and password recovery limits and choose a project-wide email limit that fits the Resend quota. Enable CAPTCHA before public traffic if signup/reset abuse appears.

Official domain transition (2026-09-05): `문선명연구소.com` uses the ASCII hostname `xn--2e0bj2wlpa62qrpaw4s.com` in service settings. Supabase Site URL and Vercel Production `AUTH_URL` are `https://xn--2e0bj2wlpa62qrpaw4s.com`, with exact `/auth/confirm` and `/reset-password` redirect URLs added. The existing Production source was redeployed with this setting; the live authentication endpoint now returns the official domain. DNS verification and SMTP integration are confirmed, and the user confirmed successful email receipt/verification. See `READY-26` in `docs/agent-work-plan.md`.

Confirmation resend: `/resend-confirmation` calls Supabase `auth.resend({ type: "signup" })`, uses the same confirmation redirect, and does not create accounts. Its UI waits 60 seconds after each request. The Supabase SMTP **Minimum interval per user** was changed from 1 to 60 seconds on 2026-09-05 so refreshing the page cannot bypass the provider's limit. Keep this setting at 60 seconds or stricter in other environments. The resend UI is a local code addition pending deployment (`READY-27`).

Release order:

- Apply `20260831000000_add_supabase_auth` only after the Dashboard settings above are complete.
- Apply `20260902000000_add_login_throttles` before deploying the login-throttling code. Until it exists, administrator login fails closed rather than bypassing the limiter.
- Convert existing researchers to Supabase Auth and populate `supabaseAuthId`/`emailVerifiedAt` before deploying code that removes legacy password login. Do not send conversion mail or apply the Production migration before `WAITING-12` approval.
- Set `AUTH_URL` to the exact temporary Vercel origin now, then replace it and the Supabase Site/redirect URLs together when the official domain is ready.
- Rotate `AUTH_SECRET` only with care because it invalidates all Auth.js sessions. Change `ADMIN_PASSWORD` before exposing the deployment.

## 7. Server and Client Component Check

- Client Component boundaries are limited to interactive forms, the auth fragment consumers, uploads, and timeline interaction.
- Database access stays in Server Components, Server Actions, or server-only helpers.
- Most forms use Server Actions with progressive enhancement. Email confirmation and password change require JavaScript because one-time tokens are read from URL fragments so access logs do not receive them.
- No browser-only APIs such as `window`, `document`, or `localStorage` are used in Server Components.
- Hydration risk is low because the rendered UI does not depend on client-only time, random values, or browser state.
- Dates displayed from posts are formatted on the server from persisted database timestamps.

## 8. Production Build Gate

Run this before every production deployment:

```bash
npm run lint
npm run build
```

Expected build shape:

- `/contact`, `/topics`는 정적 페이지로 빌드된다.
- `/`, `/notices`, `/materials`, 각 상세 경로와 `/admin` 아래 경로는 데이터베이스 또는 세션을 사용하므로 요청 시 서버 렌더링된다.
- `/login`과 `/api/auth/[...nextauth]`는 Auth.js를 사용하므로 요청 시 서버에서 처리된다.
- There should be no TypeScript, hydration, or Server/Client Component boundary errors.

## 9. Runtime Error Diagnostics

If Vercel shows a generic production error digest such as `ERROR 4167813784`, check Vercel Runtime Logs for these prefixes:

- `[server-error] env.missing-required`: missing `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_USERNAME`, or `ADMIN_PASSWORD`.
- `[env-warning]`: host/auth URL inference needs review.
- `[server-error] posts.getPublishedPosts`: public board list query failed.
- `[server-error] posts.getPublishedPostBySlug`: public post detail query failed.
- `P2021` or `The table public.posts does not exist`: database connection works, but migrations were not applied to that database.
- `[server-error] admin-auth.*`: Auth.js session lookup failed.
- `[server-error] admin.posts.*`: admin post/category query or mutation failed.
- `[server-error] auth.login.*`: credentials sign-in failed unexpectedly.

The app includes:

- `src/app/error.tsx` for route segment runtime failures.
- `src/app/global-error.tsx` for root layout/global failures.
- `src/app/admin/error.tsx` for admin segment failures.

These files show a minimal user-facing fallback while keeping sensitive stack traces in server/runtime logs.

## 10. Pre-Launch Smoke Test

After deployment, check:

- `/` loads.
- `/notices` lists published notices.
- `/materials` lists promotion materials.
- `/contact` loads and can submit a minimal inquiry.
- `/login` loads.
- `/signup` sends a confirmation email and an unconfirmed account cannot be approved.
- A confirmed, approved researcher can log in; pending or disabled researchers cannot.
- `/forgot-password` returns the same message for registered and unregistered addresses.
- A valid recovery link changes the password once and invalidates an existing researcher session.
- Unauthenticated `/admin` redirects to `/login`.
- Admin login succeeds with Vercel environment credentials.
- `/admin/posts/new` can create a draft post.
- `/admin/posts/[id]/edit` can update an existing post without creating a duplicate slug.
- `/admin/posts` can archive a post by setting `ARCHIVED` without deleting the database row.
- `/admin/inquiries` lists submitted inquiries and shows only the contact data needed for an operator to respond.
- Inquiry status can be changed to `REVIEWED` or `ARCHIVED` without deleting the record.
- Published notice/material posts appear on the public board.
- A wrong admin password does not create a session.
- Logging out returns to `/login`.

## 11. AWS Migration Notes

- Keep all deployment-specific values in environment variables.
- Keep PostgreSQL-compatible migrations in `prisma/migrations`.
- If moving to AWS, prefer RDS PostgreSQL plus a connection pooler/proxy for serverless runtimes.
- Avoid Vercel-only data APIs in application code unless there is a clear replacement plan.
- If moving behind an AWS load balancer or reverse proxy, revisit `AUTH_URL` and `AUTH_TRUST_HOST`.
- Keep Prisma access behind the existing `src/lib/prisma.ts` helper so the database provider can change without touching page components.
