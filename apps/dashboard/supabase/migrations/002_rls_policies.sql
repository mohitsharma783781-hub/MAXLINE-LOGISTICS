-- ============================================================================
-- SKYONSHIP LOGISTICS PORTAL — SUPABASE ROW-LEVEL SECURITY (RLS) POLICIES
-- Migration: 002_rls_policies.sql
-- Description: Defense-in-depth customer tenant isolation policies, 
--              immutable financial ledger rules, and secure auth helper function.
-- Security Rule: Disallows broad public access. Enforces strict tenant boundaries.
-- Safe Execution: Uses DROP POLICY IF EXISTS before CREATE POLICY for idempotency.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HELPER FUNCTION: Extract Verified Tenant ID from Native Supabase JWT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS UUID AS $$
BEGIN
    -- Uses Supabase's native auth.jwt() JSON function to extract trusted app_metadata
    RETURN (NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', ''))::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION get_auth_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_auth_tenant_id() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. ENABLE ROW-LEVEL SECURITY ON ALL CUSTOMER-OWNED TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cod_remittances ENABLE ROW LEVEL SECURITY;
ALTER TABLE cod_receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ndr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE rto_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. TENANTS POLICIES (Read-only for authenticated tenant users)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_select_policy ON tenants;
CREATE POLICY tenant_select_policy ON tenants
    FOR SELECT
    USING (id = get_auth_tenant_id());

-- ----------------------------------------------------------------------------
-- 4. USERS POLICIES (Prevent unauthorized role escalation or tenant spoofing)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS users_select_policy ON users;
CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (tenant_id = get_auth_tenant_id());

DROP POLICY IF EXISTS users_update_policy ON users;
CREATE POLICY users_update_policy ON users
    FOR UPDATE
    USING (tenant_id = get_auth_tenant_id())
    WITH CHECK (
        tenant_id = get_auth_tenant_id()
        AND tenant_id = (SELECT u.tenant_id FROM users u WHERE u.id = users.id)
        AND role = (SELECT u.role FROM users u WHERE u.id = users.id)
    );

-- ----------------------------------------------------------------------------
-- 5. WAREHOUSES POLICIES (Full CRUD restricted to tenant boundary)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS warehouses_select_policy ON warehouses;
CREATE POLICY warehouses_select_policy ON warehouses
    FOR SELECT
    USING (tenant_id = get_auth_tenant_id());

DROP POLICY IF EXISTS warehouses_insert_policy ON warehouses;
CREATE POLICY warehouses_insert_policy ON warehouses
    FOR INSERT
    WITH CHECK (tenant_id = get_auth_tenant_id());

DROP POLICY IF EXISTS warehouses_update_policy ON warehouses;
CREATE POLICY warehouses_update_policy ON warehouses
    FOR UPDATE
    USING (tenant_id = get_auth_tenant_id())
    WITH CHECK (tenant_id = get_auth_tenant_id());

DROP POLICY IF EXISTS warehouses_delete_policy ON warehouses;
CREATE POLICY warehouses_delete_policy ON warehouses
    FOR DELETE
    USING (tenant_id = get_auth_tenant_id());

-- ----------------------------------------------------------------------------
-- 6. WALLETS POLICIES (Read-only for merchant users; updates via DB RPC / Service Role)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS wallets_select_policy ON wallets;
CREATE POLICY wallets_select_policy ON wallets
    FOR SELECT
    USING (tenant_id = get_auth_tenant_id());

-- NOTE: NO INSERT, UPDATE, OR DELETE POLICIES ARE CREATED FOR WALLETS FOR AUTHENTICATED USERS.
-- Direct client SDK updates to wallet balances are strictly REJECTED.

-- ----------------------------------------------------------------------------
-- 7. WALLET TRANSACTIONS POLICIES (IMMUTABLE AUDIT LEDGER: SELECT ONLY FOR MERCHANTS)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS wallet_tx_select_policy ON wallet_transactions;
CREATE POLICY wallet_tx_select_policy ON wallet_transactions
    FOR SELECT
    USING (tenant_id = get_auth_tenant_id());

-- NOTE: NO INSERT, UPDATE, OR DELETE POLICIES ARE CREATED FOR WALLET TRANSACTIONS FOR AUTHENTICATED USERS.
-- Direct client insertion of financial credit/debit records is strictly REJECTED.
-- Ledger insertions must be performed by secure database RPCs or backend service_role.

-- ----------------------------------------------------------------------------
-- 8. SHIPMENTS POLICIES (Cross-tenant warehouse reference protection)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS shipments_select_policy ON shipments;
CREATE POLICY shipments_select_policy ON shipments
    FOR SELECT
    USING (tenant_id = get_auth_tenant_id());

DROP POLICY IF EXISTS shipments_insert_policy ON shipments;
CREATE POLICY shipments_insert_policy ON shipments
    FOR INSERT
    WITH CHECK (
        tenant_id = get_auth_tenant_id()
        AND (pickup_warehouse_id IS NULL OR EXISTS (
            SELECT 1 FROM warehouses w WHERE w.id = shipments.pickup_warehouse_id AND w.tenant_id = get_auth_tenant_id()
        ))
    );

DROP POLICY IF EXISTS shipments_update_policy ON shipments;
CREATE POLICY shipments_update_policy ON shipments
    FOR UPDATE
    USING (tenant_id = get_auth_tenant_id())
    WITH CHECK (
        tenant_id = get_auth_tenant_id()
        AND (pickup_warehouse_id IS NULL OR EXISTS (
            SELECT 1 FROM warehouses w WHERE w.id = shipments.pickup_warehouse_id AND w.tenant_id = get_auth_tenant_id()
        ))
    );

-- ----------------------------------------------------------------------------
-- 9. SHIPMENT STATUS HISTORY POLICIES (Validated status audit insertions)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS shipment_history_select_policy ON shipment_status_history;
CREATE POLICY shipment_history_select_policy ON shipment_status_history
    FOR SELECT
    USING (tenant_id = get_auth_tenant_id());

DROP POLICY IF EXISTS shipment_history_insert_policy ON shipment_status_history;
CREATE POLICY shipment_history_insert_policy ON shipment_status_history
    FOR INSERT
    WITH CHECK (
        tenant_id = get_auth_tenant_id()
        AND EXISTS (
            SELECT 1 FROM shipments s WHERE s.id = shipment_status_history.shipment_id AND s.tenant_id = get_auth_tenant_id()
        )
    );

-- ----------------------------------------------------------------------------
-- 10. COD RECEIVABLES & REMITTANCES POLICIES (Read-only for merchant users)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS cod_remittances_select_policy ON cod_remittances;
CREATE POLICY cod_remittances_select_policy ON cod_remittances
    FOR SELECT
    USING (tenant_id = get_auth_tenant_id());

DROP POLICY IF EXISTS cod_receivables_select_policy ON cod_receivables;
CREATE POLICY cod_receivables_select_policy ON cod_receivables
    FOR SELECT
    USING (tenant_id = get_auth_tenant_id());

-- NOTE: NO INSERT, UPDATE, OR DELETE POLICIES ARE CREATED FOR COD REMITTANCES OR RECEIVABLES FOR AUTHENTICATED USERS.
-- COD payout calculations, deductions, and UTR updates are managed via backend system/service_role processes.

-- ----------------------------------------------------------------------------
-- 11. PICKUP REQUESTS POLICIES (Validated warehouse reference)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS pickups_select_policy ON pickup_requests;
CREATE POLICY pickups_select_policy ON pickup_requests
    FOR SELECT
    USING (tenant_id = get_auth_tenant_id());

DROP POLICY IF EXISTS pickups_insert_policy ON pickup_requests;
CREATE POLICY pickups_insert_policy ON pickup_requests
    FOR INSERT
    WITH CHECK (
        tenant_id = get_auth_tenant_id()
        AND EXISTS (
            SELECT 1 FROM warehouses w WHERE w.id = pickup_requests.warehouse_id AND w.tenant_id = get_auth_tenant_id()
        )
    );

DROP POLICY IF EXISTS pickups_update_policy ON pickup_requests;
CREATE POLICY pickups_update_policy ON pickup_requests
    FOR UPDATE
    USING (tenant_id = get_auth_tenant_id())
    WITH CHECK (tenant_id = get_auth_tenant_id());

-- ----------------------------------------------------------------------------
-- 12. NDR & RTO POLICIES (Merchant Exception View & NDR Action Response)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS ndr_select_policy ON ndr_records;
CREATE POLICY ndr_select_policy ON ndr_records
    FOR SELECT
    USING (tenant_id = get_auth_tenant_id());

DROP POLICY IF EXISTS ndr_update_policy ON ndr_records;
CREATE POLICY ndr_update_policy ON ndr_records
    FOR UPDATE
    USING (tenant_id = get_auth_tenant_id())
    WITH CHECK (tenant_id = get_auth_tenant_id());

DROP POLICY IF EXISTS rto_select_policy ON rto_records;
CREATE POLICY rto_select_policy ON rto_records
    FOR SELECT
    USING (tenant_id = get_auth_tenant_id());

-- ----------------------------------------------------------------------------
-- 13. AUDIT LOGS POLICIES (SELECT & INSERT ONLY)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS audit_logs_select_policy ON audit_logs;
CREATE POLICY audit_logs_select_policy ON audit_logs
    FOR SELECT
    USING (tenant_id = get_auth_tenant_id());

DROP POLICY IF EXISTS audit_logs_insert_policy ON audit_logs;
CREATE POLICY audit_logs_insert_policy ON audit_logs
    FOR INSERT
    WITH CHECK (tenant_id = get_auth_tenant_id());
