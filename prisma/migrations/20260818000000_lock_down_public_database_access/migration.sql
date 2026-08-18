-- This application accesses PostgreSQL only from the Next.js server through Prisma.
-- Supabase client roles must not access application tables directly.
BEGIN;

DO $security$
DECLARE
    target_role TEXT;
BEGIN
    FOR target_role IN
        SELECT rolname
        FROM pg_roles
        WHERE rolname IN ('anon', 'authenticated')
    LOOP
        EXECUTE format(
            'REVOKE ALL PRIVILEGES ON SCHEMA public FROM %I',
            target_role
        );
        EXECUTE format(
            'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM %I',
            target_role
        );
        EXECUTE format(
            'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM %I',
            target_role
        );
        EXECUTE format(
            'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL PRIVILEGES ON TABLES FROM %I',
            target_role
        );
        EXECUTE format(
            'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL PRIVILEGES ON SEQUENCES FROM %I',
            target_role
        );
    END LOOP;
END
$security$;

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inquiries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

COMMIT;
