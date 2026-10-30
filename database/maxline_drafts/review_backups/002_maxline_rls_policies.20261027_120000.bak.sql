-- ============================================================================
-- MAXLINE LOGISTICS — ROW-LEVEL SECURITY (RLS) & ACCESS CONTROL (DRAFT FOR REVIEW)
-- Migration Script: 002_maxline_rls_policies.sql
-- Target Project: lbldljgyusyqqcbyvmem (MAXLINE Dedicated Supabase Project)
-- Architecture: Fail-Closed Tenant Isolation, Zero Recursive Policies,
--               Immutable Financial Ledgers, and Atomic Stored Procedures.
--
-- SECURITY PRINCIPLES:
-- 1. Fail-Closed: Anonymous / unauthenticated callers receive NULL and are denied.
-- 2. No Recursive RLS: Membership checks run in SECURITY DEFINER helper functions
--    with fixed search_path = pg_catalog, public to prevent infinite loops.
-- 3. Authorization Source: Authorization is resolved strictly from auth.uid()
--    and database membership, NEVER from client-supplied URL or header parameters.
-- 4. Financial Authority: Merchants cannot directly INSERT/UPDATE/DELETE the wallets
--    table via PostgREST. All wallet mutations execute through atomic RPC procedures.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SECURITY DEFINER HELPER FUNCTIONS
-- Expl: Safe, anti-tamper functions to resolve authenticated merchant context.
--       Fixed search_path prevents search_path hijacking vulnerabilities.
-- ----------------------------------------------------------------------------

-- Function A: Get Active Primary Merchant ID for Authenticated User
CREATE OR REPLACE FUNCTION public.get_auth_merchant_id()
RETURNS UUID AS $$
DECLARE
    v_merchant_id UUID;
BEGIN
    -- 1. Unauthenticated or Anonymous requests FAIL CLOSED immediately
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    -- 2. Query authoritative merchant membership for the authenticated user
    SELECT mm.merchant_id INTO v_merchant_id
    FROM public.merchant_members mm
    JOIN public.users u ON u.id = mm.user_id
    WHERE u.auth_user_id = auth.uid()
      AND u.is_active = true
    ORDER BY mm.is_default DESC, mm.created_at ASC
    LIMIT 1;

    RETURN v_merchant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION public.get_auth_merchant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_merchant_id() TO authenticated, service_role;

-- Function B: Verify Membership of a Specific Target Merchant ID
CREATE OR REPLACE FUNCTION public.is_member_of_merchant(p_merchant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL OR p_merchant_id IS NULL THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.merchant_members mm
        JOIN public.users u ON u.id = mm.user_id
        WHERE u.auth_user_id = auth.uid()
          AND mm.merchant_id = p_merchant_id
          AND u.is_active = true
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION public.is_member_of_merchant(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_member_of_merchant(UUID) TO authenticated, service_role;

-- Function C: Verify User Role within Merchant
CREATE OR REPLACE FUNCTION public.has_merchant_role(p_merchant_id UUID, p_allowed_roles merchant_member_role[])
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL OR p_merchant_id IS NULL THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.merchant_members mm
        JOIN public.users u ON u.id = mm.user_id
        WHERE u.auth_user_id = auth.uid()
          AND mm.merchant_id = p_merchant_id
          AND mm.role = ANY(p_allowed_roles)
          AND u.is_active = true
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION public.has_merchant_role(UUID, merchant_member_role[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_merchant_role(UUID, merchant_member_role[]) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. ENABLE ROW-LEVEL SECURITY ON ALL TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifest_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ndr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE rto_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cod_remittances ENABLE ROW LEVEL SECURITY;
ALTER TABLE cod_receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_rate_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. RLS POLICIES FOR CORE TABLES
-- ----------------------------------------------------------------------------

-- 3.1 MERCHANTS POLICIES
DROP POLICY IF EXISTS merchants_select_policy ON merchants;
CREATE POLICY merchants_select_policy ON merchants
    FOR SELECT
    USING (public.is_member_of_merchant(id));

DROP POLICY IF EXISTS merchants_update_policy ON merchants;
CREATE POLICY merchants_update_policy ON merchants
    FOR UPDATE
    USING (public.has_merchant_role(id, ARRAY['OWNER'::merchant_member_role, 'ADMIN'::merchant_member_role]))
    WITH CHECK (public.has_merchant_role(id, ARRAY['OWNER'::merchant_member_role, 'ADMIN'::merchant_member_role]));

-- 3.2 USERS POLICIES
DROP POLICY IF EXISTS users_select_policy ON users;
CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (
        auth_user_id = auth.uid()
        OR id IN (
            SELECT mm.user_id 
            FROM public.merchant_members mm 
            WHERE mm.merchant_id = public.get_auth_merchant_id()
        )
    );

DROP POLICY IF EXISTS users_update_policy ON users;
CREATE POLICY users_update_policy ON users
    FOR UPDATE
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- 3.3 MERCHANT MEMBERS POLICIES
DROP POLICY IF EXISTS merchant_members_select_policy ON merchant_members;
CREATE POLICY merchant_members_select_policy ON merchant_members
    FOR SELECT
    USING (public.is_member_of_merchant(merchant_id));

-- 3.4 WAREHOUSES POLICIES (Tenant Scoped Full CRUD)
DROP POLICY IF EXISTS warehouses_select_policy ON warehouses;
CREATE POLICY warehouses_select_policy ON warehouses
    FOR SELECT
    USING (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS warehouses_insert_policy ON warehouses;
CREATE POLICY warehouses_insert_policy ON warehouses
    FOR INSERT
    WITH CHECK (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS warehouses_update_policy ON warehouses;
CREATE POLICY warehouses_update_policy ON warehouses
    FOR UPDATE
    USING (merchant_id = public.get_auth_merchant_id())
    WITH CHECK (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS warehouses_delete_policy ON warehouses;
CREATE POLICY warehouses_delete_policy ON warehouses
    FOR DELETE
    USING (merchant_id = public.get_auth_merchant_id());

-- 3.5 WALLETS POLICIES (Read-Only for Merchant Users)
-- Security Rule: Direct client INSERT/UPDATE/DELETE is strictly forbidden.
-- Balance mutations MUST proceed through atomic RPC or backend service_role.
DROP POLICY IF EXISTS wallets_select_policy ON wallets;
CREATE POLICY wallets_select_policy ON wallets
    FOR SELECT
    USING (merchant_id = public.get_auth_merchant_id());

-- 3.6 WALLET TRANSACTIONS POLICIES (Read-Only Immutable Audit Log)
DROP POLICY IF EXISTS wallet_tx_select_policy ON wallet_transactions;
CREATE POLICY wallet_tx_select_policy ON wallet_transactions
    FOR SELECT
    USING (merchant_id = public.get_auth_merchant_id());

-- 3.7 SHIPMENTS POLICIES (Tenant-Scoped Dispatches)
DROP POLICY IF EXISTS shipments_select_policy ON shipments;
CREATE POLICY shipments_select_policy ON shipments
    FOR SELECT
    USING (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS shipments_insert_policy ON shipments;
CREATE POLICY shipments_insert_policy ON shipments
    FOR INSERT
    WITH CHECK (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS shipments_update_policy ON shipments;
CREATE POLICY shipments_update_policy ON shipments
    FOR UPDATE
    USING (merchant_id = public.get_auth_merchant_id())
    WITH CHECK (merchant_id = public.get_auth_merchant_id());

-- 3.8 SHIPMENT PACKAGES POLICIES
DROP POLICY IF EXISTS shipment_packages_select_policy ON shipment_packages;
CREATE POLICY shipment_packages_select_policy ON shipment_packages
    FOR SELECT
    USING (
        shipment_id IN (
            SELECT s.id FROM public.shipments s 
            WHERE s.merchant_id = public.get_auth_merchant_id()
        )
    );

DROP POLICY IF EXISTS shipment_packages_insert_policy ON shipment_packages;
CREATE POLICY shipment_packages_insert_policy ON shipment_packages
    FOR INSERT
    WITH CHECK (
        shipment_id IN (
            SELECT s.id FROM public.shipments s 
            WHERE s.merchant_id = public.get_auth_merchant_id()
        )
    );

-- 3.9 TRACKING EVENTS POLICIES
DROP POLICY IF EXISTS tracking_events_select_policy ON shipment_tracking_events;
CREATE POLICY tracking_events_select_policy ON shipment_tracking_events
    FOR SELECT
    USING (
        shipment_id IN (
            SELECT s.id FROM public.shipments s 
            WHERE s.merchant_id = public.get_auth_merchant_id()
        )
    );

-- ----------------------------------------------------------------------------
-- 4. RLS POLICIES FOR LOGISTICS & LIFECYCLE MODULES
-- ----------------------------------------------------------------------------

-- Manifests
DROP POLICY IF EXISTS manifests_select_policy ON manifests;
CREATE POLICY manifests_select_policy ON manifests
    FOR SELECT USING (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS manifests_insert_policy ON manifests;
CREATE POLICY manifests_insert_policy ON manifests
    FOR INSERT WITH CHECK (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS manifest_items_select_policy ON manifest_items;
CREATE POLICY manifest_items_select_policy ON manifest_items
    FOR SELECT USING (
        manifest_id IN (
            SELECT m.id FROM public.manifests m 
            WHERE m.merchant_id = public.get_auth_merchant_id()
        )
    );

-- Pickup Requests
DROP POLICY IF EXISTS pickups_select_policy ON pickup_requests;
CREATE POLICY pickups_select_policy ON pickup_requests
    FOR SELECT USING (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS pickups_insert_policy ON pickup_requests;
CREATE POLICY pickups_insert_policy ON pickup_requests
    FOR INSERT WITH CHECK (merchant_id = public.get_auth_merchant_id());

-- NDR & RTO Records
DROP POLICY IF EXISTS ndr_select_policy ON ndr_records;
CREATE POLICY ndr_select_policy ON ndr_records
    FOR SELECT USING (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS ndr_update_policy ON ndr_records;
CREATE POLICY ndr_update_policy ON ndr_records
    FOR UPDATE
    USING (merchant_id = public.get_auth_merchant_id())
    WITH CHECK (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS rto_select_policy ON rto_records;
CREATE POLICY rto_select_policy ON rto_records
    FOR SELECT USING (merchant_id = public.get_auth_merchant_id());

-- Weight Discrepancies
DROP POLICY IF EXISTS weight_discrepancies_select_policy ON weight_discrepancies;
CREATE POLICY weight_discrepancies_select_policy ON weight_discrepancies
    FOR SELECT USING (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS weight_discrepancies_update_policy ON weight_discrepancies;
CREATE POLICY weight_discrepancies_update_policy ON weight_discrepancies
    FOR UPDATE
    USING (merchant_id = public.get_auth_merchant_id())
    WITH CHECK (merchant_id = public.get_auth_merchant_id());

-- COD Receivables & Remittances
DROP POLICY IF EXISTS cod_remittances_select_policy ON cod_remittances;
CREATE POLICY cod_remittances_select_policy ON cod_remittances
    FOR SELECT USING (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS cod_receivables_select_policy ON cod_receivables;
CREATE POLICY cod_receivables_select_policy ON cod_receivables
    FOR SELECT USING (merchant_id = public.get_auth_merchant_id());

-- Rate Cards & Commercial Assignments
DROP POLICY IF EXISTS carrier_rate_cards_select_policy ON carrier_rate_cards;
CREATE POLICY carrier_rate_cards_select_policy ON carrier_rate_cards
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS rate_assignments_select_policy ON merchant_rate_assignments;
CREATE POLICY rate_assignments_select_policy ON merchant_rate_assignments
    FOR SELECT USING (merchant_id = public.get_auth_merchant_id());

-- Bank Details & KYC Documents
DROP POLICY IF EXISTS bank_accounts_select_policy ON merchant_bank_accounts;
CREATE POLICY bank_accounts_select_policy ON merchant_bank_accounts
    FOR SELECT USING (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS bank_accounts_insert_policy ON merchant_bank_accounts;
CREATE POLICY bank_accounts_insert_policy ON merchant_bank_accounts
    FOR INSERT WITH CHECK (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS kyc_docs_select_policy ON merchant_kyc_documents;
CREATE POLICY kyc_docs_select_policy ON merchant_kyc_documents
    FOR SELECT USING (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS kyc_docs_insert_policy ON merchant_kyc_documents;
CREATE POLICY kyc_docs_insert_policy ON merchant_kyc_documents
    FOR INSERT WITH CHECK (merchant_id = public.get_auth_merchant_id());

-- Invoices & Audit Logs
DROP POLICY IF EXISTS gst_invoices_select_policy ON gst_invoices;
CREATE POLICY gst_invoices_select_policy ON gst_invoices
    FOR SELECT USING (merchant_id = public.get_auth_merchant_id());

DROP POLICY IF EXISTS audit_logs_select_policy ON audit_logs;
CREATE POLICY audit_logs_select_policy ON audit_logs
    FOR SELECT USING (merchant_id = public.get_auth_merchant_id());

-- ============================================================================
-- 5. ATOMIC FINANCIAL STORED PROCEDURES (Minor-Unit Row-Locked Ledger)
-- Expl: Strictly enforces double-debit prevention via idempotency keys,
--       locks the wallet row with FOR UPDATE, and performs atomic deductions.
-- ============================================================================

-- Procedure 5.1: ATOMIC WALLET DEBIT RPC
CREATE OR REPLACE FUNCTION public.debit_wallet_rpc(
    p_merchant_id UUID,
    p_amount_minor BIGINT,
    p_reference_type TEXT,
    p_reference_id TEXT,
    p_idempotency_key TEXT,
    p_description TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_caller_merchant_id UUID;
    v_wallet RECORD;
    v_balance_before BIGINT;
    v_balance_after BIGINT;
    v_existing_tx RECORD;
    v_tx_id UUID;
BEGIN
    -- 1. Security Check: Verify caller belongs to target merchant
    v_caller_merchant_id := public.get_auth_merchant_id();
    IF v_caller_merchant_id IS NULL OR v_caller_merchant_id <> p_merchant_id THEN
        RAISE EXCEPTION 'Security Violation: Unauthorized merchant wallet access';
    END IF;

    -- 2. Validate Amount
    IF p_amount_minor <= 0 THEN
        RAISE EXCEPTION 'Invalid Amount: Debit amount must be strictly greater than 0 paise';
    END IF;

    -- 3. Idempotency Check: Prevent duplicate debit if network timed out
    SELECT * INTO v_existing_tx 
    FROM public.wallet_transactions 
    WHERE idempotency_key = p_idempotency_key 
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_duplicate', true,
            'message', 'Transaction already posted (Idempotency matched)',
            'transaction_id', v_existing_tx.id,
            'balance_after_minor', v_existing_tx.balance_after_minor
        );
    END IF;

    -- 4. Lock Wallet Row with FOR UPDATE (Prevents Concurrent Race Conditions)
    SELECT * INTO v_wallet 
    FROM public.wallets 
    WHERE merchant_id = p_merchant_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet NotFound: No active wallet found for merchant';
    END IF;

    IF v_wallet.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'Wallet Locked: Merchant wallet is currently suspended or frozen';
    END IF;

    -- 5. Check Overdraft Condition
    IF v_wallet.available_balance_minor < p_amount_minor THEN
        RETURN jsonb_build_object(
            'success', false,
            'insufficient_funds', true,
            'message', 'Insufficient wallet balance to complete dispatch',
            'available_balance_minor', v_wallet.available_balance_minor,
            'required_minor', p_amount_minor
        );
    END IF;

    v_balance_before := v_wallet.available_balance_minor;
    v_balance_after := v_balance_before - p_amount_minor;

    -- 6. Atomic Mutation
    UPDATE public.wallets
    SET available_balance_minor = v_balance_after,
        total_spent_minor = total_spent_minor + p_amount_minor,
        version = version + 1,
        updated_at = now()
    WHERE id = v_wallet.id;

    -- 7. Insert Immutable Ledger Row
    INSERT INTO public.wallet_transactions (
        merchant_id,
        wallet_id,
        type,
        direction,
        amount_minor,
        balance_before_minor,
        balance_after_minor,
        currency,
        idempotency_key,
        reference_type,
        reference_id,
        description
    ) VALUES (
        p_merchant_id,
        v_wallet.id,
        'FREIGHT_DEBIT'::wallet_tx_type,
        'DEBIT'::wallet_tx_direction,
        p_amount_minor,
        v_balance_before,
        v_balance_after,
        'INR',
        p_idempotency_key,
        p_reference_type,
        p_reference_id,
        p_description
    ) RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object(
        'success', true,
        'is_duplicate', false,
        'transaction_id', v_tx_id,
        'balance_before_minor', v_balance_before,
        'balance_after_minor', v_balance_after
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION public.debit_wallet_rpc(UUID, BIGINT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.debit_wallet_rpc(UUID, BIGINT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- Procedure 5.2: ATOMIC WALLET CREDIT RPC (For Recharges and Remittances)
CREATE OR REPLACE FUNCTION public.credit_wallet_rpc(
    p_merchant_id UUID,
    p_amount_minor BIGINT,
    p_reference_type TEXT,
    p_reference_id TEXT,
    p_idempotency_key TEXT,
    p_description TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
    v_balance_before BIGINT;
    v_balance_after BIGINT;
    v_existing_tx RECORD;
    v_tx_id UUID;
BEGIN
    IF p_amount_minor <= 0 THEN
        RAISE EXCEPTION 'Invalid Amount: Credit amount must be strictly greater than 0 paise';
    END IF;

    -- 1. Idempotency Guard
    SELECT * INTO v_existing_tx 
    FROM public.wallet_transactions 
    WHERE idempotency_key = p_idempotency_key 
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_duplicate', true,
            'message', 'Transaction already posted (Idempotency matched)',
            'transaction_id', v_existing_tx.id,
            'balance_after_minor', v_existing_tx.balance_after_minor
        );
    END IF;

    -- 2. Row Lock
    SELECT * INTO v_wallet 
    FROM public.wallets 
    WHERE merchant_id = p_merchant_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet NotFound: No wallet found for merchant';
    END IF;

    v_balance_before := v_wallet.available_balance_minor;
    v_balance_after := v_balance_before + p_amount_minor;

    -- 3. Atomic Mutation
    UPDATE public.wallets
    SET available_balance_minor = v_balance_after,
        total_recharged_minor = total_recharged_minor + p_amount_minor,
        version = version + 1,
        updated_at = now()
    WHERE id = v_wallet.id;

    -- 4. Ledger Entry
    INSERT INTO public.wallet_transactions (
        merchant_id,
        wallet_id,
        type,
        direction,
        amount_minor,
        balance_before_minor,
        balance_after_minor,
        currency,
        idempotency_key,
        reference_type,
        reference_id,
        description
    ) VALUES (
        p_merchant_id,
        v_wallet.id,
        'RECHARGE'::wallet_tx_type,
        'CREDIT'::wallet_tx_direction,
        p_amount_minor,
        v_balance_before,
        v_balance_after,
        'INR',
        p_idempotency_key,
        p_reference_type,
        p_reference_id,
        p_description
    ) RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object(
        'success', true,
        'is_duplicate', false,
        'transaction_id', v_tx_id,
        'balance_before_minor', v_balance_before,
        'balance_after_minor', v_balance_after
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION public.credit_wallet_rpc(UUID, BIGINT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_wallet_rpc(UUID, BIGINT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- ============================================================================
-- 6. PROPOSED SIGNUP TRIGGER SPECIFICATION (HELD FOR REVIEW)
-- Note: As specified in safety guidelines, this trigger is NOT active.
--       It is documented here for architectural review only.
-- ============================================================================
/*
CREATE OR REPLACE FUNCTION public.handle_new_auth_user_template()
RETURNS trigger AS $$
DECLARE
    new_merchant_id UUID;
    new_user_id UUID;
BEGIN
    -- Provision Tenant
    INSERT INTO public.merchants (business_name, status)
    VALUES (
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'business_name', ''), 'My Logistics Business'),
        'ACTIVE'
    ) RETURNING id INTO new_merchant_id;

    -- Provision User Profile
    INSERT INTO public.users (auth_user_id, email, full_name, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'phone_number'
    ) RETURNING id INTO new_user_id;

    -- Assign Owner Membership
    INSERT INTO public.merchant_members (merchant_id, user_id, role, is_default)
    VALUES (new_merchant_id, new_user_id, 'OWNER', true);

    -- Provision Zero-Balance Wallet (₹0.00)
    INSERT INTO public.wallets (merchant_id, available_balance_minor, reserved_balance_minor)
    VALUES (new_merchant_id, 0, 0);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
*/
