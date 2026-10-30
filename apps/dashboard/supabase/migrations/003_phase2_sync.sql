-- ============================================================================
-- SKYONSHIP LOGISTICS PORTAL — SUPABASE PHASE 2 SYNCHRONIZATION MIGRATION
-- Migration: 003_phase2_sync.sql
-- Description: 
--   1. Seed primary tenant ('00000000-0000-0000-0000-000000000001'), wallet & warehouse
--   2. Enhanced get_auth_tenant_id() with fallback for seamless client access
--   3. Atomic, race-condition protected stored procedures (debit_wallet_rpc, credit_wallet_rpc)
--   4. Idempotent column additions on warehouses table
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND WAREHOUSES TABLE COLUMNS SAFELY
-- ----------------------------------------------------------------------------
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS warehouse_code VARCHAR(50);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS pickup_start_time VARCHAR(20) DEFAULT '10:00 AM';
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS pickup_end_time VARCHAR(20) DEFAULT '06:00 PM';
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';

-- ----------------------------------------------------------------------------
-- 2. SEED DEFAULT PLATFORM / DEMO TENANT, WALLET, AND WAREHOUSE
-- ----------------------------------------------------------------------------
INSERT INTO tenants (id, company_name, gst_number, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Apex Logistics & Retail',
    '07AAAAA0000A1Z5',
    'ACTIVE'
)
ON CONFLICT (id) DO UPDATE 
SET company_name = EXCLUDED.company_name;

INSERT INTO wallets (
    id,
    tenant_id,
    currency,
    available_balance_minor,
    reserved_balance_minor,
    total_spent_minor,
    total_refunded_minor,
    low_balance_threshold_minor,
    status
)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'INR',
    5000000, -- ₹50,000.00 initial operating credit for merchant testing
    0,
    0,
    0,
    50000,  -- ₹500.00 low balance alert threshold
    'ACTIVE'
)
ON CONFLICT (tenant_id) DO UPDATE
SET status = 'ACTIVE';

INSERT INTO warehouses (
    id,
    tenant_id,
    name,
    warehouse_code,
    address_line1,
    city,
    state,
    pincode,
    contact_person,
    phone,
    pickup_start_time,
    pickup_end_time,
    is_default,
    status
)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Delhi Connaught Primary Warehouse',
    'DEL-WH-01',
    'Plot 42, Block B, Connaught Place',
    'New Delhi',
    'Delhi',
    '110001',
    'Rajesh Kumar',
    '+91 98765 43210',
    '10:00 AM',
    '06:00 PM',
    true,
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. ENHANCED get_auth_tenant_id() FUNCTION
-- Resolves tenant from app_metadata, user_metadata, public.users, or default tenant
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS UUID AS $$
DECLARE
    tid UUID;
BEGIN
    -- Check app_metadata
    tid := (NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', ''))::uuid;
    IF tid IS NOT NULL THEN
        RETURN tid;
    END IF;

    -- Check user_metadata
    tid := (NULLIF(auth.jwt() -> 'user_metadata' ->> 'tenant_id', ''))::uuid;
    IF tid IS NOT NULL THEN
        RETURN tid;
    END IF;

    -- Check public.users table if authenticated
    IF auth.uid() IS NOT NULL THEN
        SELECT tenant_id INTO tid FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
        IF tid IS NOT NULL THEN
            RETURN tid;
        END IF;
    END IF;

    -- Fallback to default demo/platform tenant
    RETURN '00000000-0000-0000-0000-000000000001'::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN '00000000-0000-0000-0000-000000000001'::uuid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION get_auth_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_auth_tenant_id() TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. SECURE ATOMIC WALLET DEBIT RPC (Row-locked with FOR UPDATE)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION debit_wallet_rpc(
    p_tenant_id UUID,
    p_amount_minor BIGINT,
    p_shipment_id TEXT,
    p_order_id TEXT,
    p_courier_name TEXT,
    p_idempotency_key TEXT,
    p_actor_type TEXT DEFAULT 'SYSTEM'
)
RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
    v_tx_id UUID;
    v_balance_before BIGINT;
    v_balance_after BIGINT;
    v_existing_tx RECORD;
BEGIN
    -- 1. Idempotency Check: double-debit protection
    SELECT * INTO v_existing_tx FROM wallet_transactions WHERE idempotency_key = p_idempotency_key LIMIT 1;
    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Transaction already posted (Idempotency guard matched)',
            'is_duplicate', true,
            'transaction_id', v_existing_tx.id,
            'balance_after_minor', v_existing_tx.balance_after_minor
        );
    END IF;

    -- 2. Lock the wallet row for atomic update
    SELECT * INTO v_wallet FROM wallets WHERE tenant_id = p_tenant_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Wallet record not found for tenant',
            'code', 'WALLET_NOT_FOUND'
        );
    END IF;

    IF v_wallet.status = 'SUSPENDED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Wallet account is suspended. Debit operations are rejected.',
            'code', 'WALLET_SUSPENDED'
        );
    END IF;

    IF v_wallet.available_balance_minor < p_amount_minor THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Insufficient wallet balance',
            'code', 'INSUFFICIENT_BALANCE',
            'available_minor', v_wallet.available_balance_minor,
            'required_minor', p_amount_minor
        );
    END IF;

    v_balance_before := v_wallet.available_balance_minor;
    v_balance_after := v_balance_before - p_amount_minor;

    -- 3. Update wallet balance
    UPDATE wallets
    SET available_balance_minor = v_balance_after,
        total_spent_minor = total_spent_minor + p_amount_minor,
        updated_at = NOW()
    WHERE id = v_wallet.id;

    -- 4. Append immutable ledger audit entry
    INSERT INTO wallet_transactions (
        tenant_id,
        wallet_id,
        type,
        direction,
        amount_minor,
        currency,
        reference_type,
        reference_id,
        description,
        balance_before_minor,
        balance_after_minor,
        status,
        idempotency_key,
        actor_type
    ) VALUES (
        p_tenant_id,
        v_wallet.id,
        'SHIPMENT_CHARGE',
        'DEBIT',
        p_amount_minor,
        'INR',
        'SHIPMENT',
        p_shipment_id,
        'Shipment Freight Charge (' || p_courier_name || ' • Order ' || p_order_id || ')',
        v_balance_before,
        v_balance_after,
        'POSTED',
        p_idempotency_key,
        p_actor_type
    ) RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Shipment charge posted successfully',
        'is_duplicate', false,
        'transaction_id', v_tx_id,
        'balance_before_minor', v_balance_before,
        'balance_after_minor', v_balance_after
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION debit_wallet_rpc FROM PUBLIC;
GRANT EXECUTE ON FUNCTION debit_wallet_rpc TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. SECURE ATOMIC WALLET CREDIT RPC (Recharges & Refunds)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION credit_wallet_rpc(
    p_tenant_id UUID,
    p_amount_minor BIGINT,
    p_type transaction_type,
    p_reference_type TEXT,
    p_reference_id TEXT,
    p_description TEXT,
    p_idempotency_key TEXT,
    p_actor_type TEXT DEFAULT 'MERCHANT'
)
RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
    v_tx_id UUID;
    v_balance_before BIGINT;
    v_balance_after BIGINT;
    v_existing_tx RECORD;
BEGIN
    SELECT * INTO v_existing_tx FROM wallet_transactions WHERE idempotency_key = p_idempotency_key LIMIT 1;
    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Transaction already posted (Idempotency guard matched)',
            'is_duplicate', true,
            'transaction_id', v_existing_tx.id,
            'balance_after_minor', v_existing_tx.balance_after_minor
        );
    END IF;

    SELECT * INTO v_wallet FROM wallets WHERE tenant_id = p_tenant_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Wallet not found for tenant');
    END IF;

    v_balance_before := v_wallet.available_balance_minor;
    v_balance_after := v_balance_before + p_amount_minor;

    UPDATE wallets
    SET available_balance_minor = v_balance_after,
        updated_at = NOW()
    WHERE id = v_wallet.id;

    INSERT INTO wallet_transactions (
        tenant_id,
        wallet_id,
        type,
        direction,
        amount_minor,
        currency,
        reference_type,
        reference_id,
        description,
        balance_before_minor,
        balance_after_minor,
        status,
        idempotency_key,
        actor_type
    ) VALUES (
        p_tenant_id,
        v_wallet.id,
        p_type,
        'CREDIT',
        p_amount_minor,
        'INR',
        p_reference_type,
        p_reference_id,
        p_description,
        v_balance_before,
        v_balance_after,
        'POSTED',
        p_idempotency_key,
        p_actor_type
    ) RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Wallet credited successfully',
        'transaction_id', v_tx_id,
        'balance_before_minor', v_balance_before,
        'balance_after_minor', v_balance_after
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION credit_wallet_rpc FROM PUBLIC;
GRANT EXECUTE ON FUNCTION credit_wallet_rpc TO anon, authenticated, service_role;
