-- Supabase Auth becomes the password and email-ownership authority for researchers.
-- Existing password hashes remain temporarily so Production users can be migrated
-- in a separately approved operation before this column is removed.
ALTER TABLE "users"
ADD COLUMN "supabaseAuthId" UUID,
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "passwordHash" DROP NOT NULL;

CREATE UNIQUE INDEX "users_supabaseAuthId_key" ON "users"("supabaseAuthId");
