-- ============================================================================
-- MAXLINE LOGISTICS — PRE-MIGRATION SKELETON REPLACEMENT (STEP 0)
-- Script: 000_prepare_maxline_baseline.sql
-- Target Project: lbldljgyusyqqcbyvmem (MAXLINE Dedicated Supabase Project)
--
-- PURPOSE:
-- Safely clears the 3 empty Prisma placeholder tables (0 rows) and unused enum
-- to eliminate column type conflicts (text vs UUID) before applying the
-- comprehensive MAXLINE core schema (001_maxline_core_schema.sql).
--
-- PRESERVATION RULES:
-- 1. _prisma_migrations is STRICTLY PRESERVED to maintain migration audit history.
-- 2. Only empty placeholder tables (verified 0 rows) are cleared.
-- ============================================================================

BEGIN;
DROP TABLE IF EXISTS public.merchant_members RESTRICT;
DROP TABLE IF EXISTS public.merchants RESTRICT;
DROP TABLE IF EXISTS public.users RESTRICT;
DROP TYPE IF EXISTS public."MerchantRole" RESTRICT;
COMMIT;
