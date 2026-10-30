-- ============================================================================
-- MAXLINE LOGISTICS — RECOVERABLE PRE-MIGRATION SKELETON BACKUP
-- Target Project: lbldljgyusyqqcbyvmem
-- Generated: 2026-10-27T06:56:11.896Z
-- Purpose: Complete snapshot of initial Prisma skeleton tables & migration records
-- ============================================================================

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE "MerchantRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. TABLES
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

CREATE TABLE IF NOT EXISTS "merchants" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "merchant_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "role" "MerchantRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "merchant_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "merchant_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "merchant_members_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "merchant_members_userId_idx" ON "merchant_members"("userId");
CREATE INDEX IF NOT EXISTS "merchant_members_merchantId_idx" ON "merchant_members"("merchantId");
CREATE UNIQUE INDEX IF NOT EXISTS "merchant_members_userId_merchantId_key" ON "merchant_members"("userId", "merchantId");

-- 3. PRISMA MIGRATION METADATA RECORD
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- Insert preserved migration rows
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
VALUES ('ecea7ab7-7ef3-4a49-a955-648ec8f2def8', '427a52f94eb411fa6af2a08eba57eccc430f948791b2550592fc4f80c8c78039', '2026-10-25T16:17:54.645Z', '20261025161752_init', NULL, NULL, '2026-10-25T16:17:53.783Z', 1)
ON CONFLICT ("id") DO NOTHING;
