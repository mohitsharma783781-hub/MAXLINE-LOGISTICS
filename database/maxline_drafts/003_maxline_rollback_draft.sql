-- ============================================================================
-- MAXLINE LOGISTICS — OFFLINE ROLLBACK DRAFT (EMERGENCY DEVELOPMENT RESET ONLY)
-- Script: 003_maxline_rollback_draft.sql
-- Target Project: lbldljgyusyqqcbyvmem (MAXLINE Dedicated Supabase Project)
--
-- ⚠️ SEVERE DATA LOSS WARNING:
-- THIS SCRIPT EXECUTES DESTRUCTIVE 'DROP ... CASCADE' COMMANDS.
-- EXECUTING THIS SCRIPT WILL PERMANENTLY DESTROY ALL MAXLINE TABLES, LEDGERS,
-- WALLET BALANCES, CONSTRAINTS, ENUMS, STORED PROCEDURES, AND AUDIT RECORDS.
--
-- STRICT OPERATIONAL RULES:
-- 1. DO NOT EXECUTE THIS SCRIPT AUTOMATICALLY.
-- 2. THIS SCRIPT MUST NEVER BE RUN IN A PRODUCTION ENVIRONMENT WITH LIVE DATA.
-- 3. THIS IS AN OFFLINE ARTIFACT INTENDED SOLELY FOR COMPLETE DEVELOPMENT TEARDOWN
--    BEFORE LIVE TRAFFIC COMMENCES.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DROP STORED PROCEDURES & HELPER FUNCTIONS
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.debit_wallet_rpc(UUID, BIGINT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.credit_wallet_rpc(UUID, BIGINT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.has_merchant_role(UUID, merchant_member_role[]);
DROP FUNCTION IF EXISTS public.is_member_of_merchant(UUID);
DROP FUNCTION IF EXISTS public.get_auth_merchant_id();

-- ----------------------------------------------------------------------------
-- 2. DROP DOMAIN TABLES IN REVERSE DEPENDENCY ORDER
-- ----------------------------------------------------------------------------

-- Part 3 Tables (Commercial & Compliance)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.gst_invoices CASCADE;
DROP TABLE IF EXISTS public.merchant_kyc_documents CASCADE;
DROP TABLE IF EXISTS public.merchant_bank_accounts CASCADE;
DROP TABLE IF EXISTS public.merchant_rate_assignments CASCADE;
DROP TABLE IF EXISTS public.carrier_rate_cards CASCADE;

-- Part 2 Tables (Lifecycle & Exceptions)
DROP TABLE IF EXISTS public.cod_receivables CASCADE;
DROP TABLE IF EXISTS public.cod_remittances CASCADE;
DROP TABLE IF EXISTS public.weight_discrepancies CASCADE;
DROP TABLE IF EXISTS public.rto_records CASCADE;
DROP TABLE IF EXISTS public.ndr_records CASCADE;
DROP TABLE IF EXISTS public.pickup_requests CASCADE;
DROP TABLE IF EXISTS public.manifest_items CASCADE;
DROP TABLE IF EXISTS public.manifests CASCADE;

-- Part 1 Tables (Core Operational Entities)
DROP TABLE IF EXISTS public.shipment_tracking_events CASCADE;
DROP TABLE IF EXISTS public.shipment_packages CASCADE;
DROP TABLE IF EXISTS public.shipments CASCADE;
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.warehouses CASCADE;
DROP TABLE IF EXISTS public.merchant_members CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.merchants CASCADE;

-- ----------------------------------------------------------------------------
-- 3. DROP CUSTOM ENUM TYPES
-- ----------------------------------------------------------------------------
DROP TYPE IF EXISTS public.weight_discrepancy_status CASCADE;
DROP TYPE IF EXISTS public.cod_status CASCADE;
DROP TYPE IF EXISTS public.rto_status CASCADE;
DROP TYPE IF EXISTS public.ndr_status CASCADE;
DROP TYPE IF EXISTS public.platform_shipment_status CASCADE;
DROP TYPE IF EXISTS public.shipment_payment_mode CASCADE;
DROP TYPE IF EXISTS public.shipment_mode CASCADE;
DROP TYPE IF EXISTS public.wallet_tx_direction CASCADE;
DROP TYPE IF EXISTS public.wallet_tx_type CASCADE;
DROP TYPE IF EXISTS public.wallet_status CASCADE;
DROP TYPE IF EXISTS public.merchant_member_role CASCADE;
DROP TYPE IF EXISTS public.merchant_status CASCADE;
