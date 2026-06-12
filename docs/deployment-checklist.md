# Vercel Deployment Checklist

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
- Use the default Vercel build command:

```bash
npm run build
```

- No custom `vercel.json` is required for the current MVP.
- Confirm Node.js version support in Vercel if the local/runtime version changes later.
- Leave the runtime as the default Node.js/serverless runtime. Do not move Prisma-backed routes to Edge runtime unless the database driver and adapter are explicitly changed for Edge.

## 3. Environment Variables

Set these in Vercel Project Settings for Production and Preview as needed:

```bash
DATABASE_URL=
AUTH_SECRET=
AUTH_URL=
ADMIN_USERNAME=
ADMIN_PASSWORD=
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
- After changing any Vercel environment variable, redeploy. Existing deployments do not automatically receive updated values.
- If a required variable is missing, Vercel Runtime Logs should contain `[server-error] env.missing-required` with the missing variable name.
- For Auth.js compatibility, this project uses the current `AUTH_*` naming. If older docs or tools mention `NEXTAUTH_URL`, treat it as an alias for `AUTH_URL`; do not set conflicting values.

## 4. PostgreSQL Provider

Recommended deployment-friendly options:

- Vercel Postgres / Neon
- Supabase PostgreSQL
- AWS RDS PostgreSQL with a proxy or pooler when moving to AWS

Before first production deploy:

- Create the database.
- Copy the provider's PostgreSQL connection string into `DATABASE_URL`.
- Ensure SSL is enabled when the provider requires it, usually with `sslmode=require`.
- For Preview deployments, use a separate preview database if migrations may differ from Production.
- Confirm the database connection limit is compatible with serverless traffic. Use provider pooling, RDS Proxy, or an equivalent pooler when needed.

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

- Admin login uses Auth.js credentials with a single account.
- `/admin` routes require an authenticated session.
- Server Actions that mutate posts also check the session server-side.
- Auth environment variables are validated at runtime startup. Missing `AUTH_SECRET`, `ADMIN_USERNAME`, or `ADMIN_PASSWORD` should appear in Vercel Runtime Logs as `[server-error] env.missing-required`.
- If neither `AUTH_URL` nor `NEXTAUTH_URL` is set outside Vercel, the app logs `[env-warning]` so host inference can be checked.
- Rotate `AUTH_SECRET` only with care because it invalidates existing sessions.
- Change `ADMIN_PASSWORD` before exposing the deployment.
- Credentials are read from environment variables. No administrator secret should be committed.
- The current MVP intentionally avoids OAuth and database-backed user accounts to keep one-person operation simple.

## 7. Server and Client Component Check

- The current app does not define broad Client Component boundaries with `"use client"`.
- Database access stays in Server Components, Server Actions, or server-only helpers.
- Forms use Server Actions, so they work with progressive enhancement and do not require client state for submission.
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

- `/`, `/notices`, `/materials`, `/login`, `/admin`, and detail/admin routes should be dynamic or server-rendered on demand.
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
