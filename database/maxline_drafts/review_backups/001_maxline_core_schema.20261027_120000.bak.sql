-- ============================================================================
-- MAXLINE LOGISTICS — POSTGRESQL CORE RELATIONAL SCHEMA (DRAFT FOR REVIEW)
-- Migration Script: 001_maxline_core_schema.sql
-- Target Project: lbldljgyusyqqcbyvmem (MAXLINE Dedicated Supabase Project)
-- Architecture: Multi-Tenant Tenant-Isolated Logistics Aggregation Engine
-- Security: Native PostgreSQL UUIDs, Fail-Closed Foreign Keys, Atomic Ledgers
--
-- STRICT FINANCIAL COMPLIANCE:
-- 1. All monetary balances and fees are stored in integer minor units (paise BIGINT).
--    Rule: ₹1.00 = 100 paise; ₹500.00 = 50,000 paise. Floating point money is prohibited.
-- 2. Ledger changes require atomic debit/credit procedures with row-level locks.
-- 3. Idempotency keys are enforced via unique constraints to block double-debiting.
-- ============================================================================

-- Enable cryptographic extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE merchant_status AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_KYC', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE merchant_member_role AS ENUM ('OWNER', 'ADMIN', 'OPS_USER', 'FINANCE_USER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE wallet_status AS ENUM ('ACTIVE', 'FROZEN', 'LOW_BALANCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE wallet_tx_type AS ENUM (
        'RECHARGE',
        'FREIGHT_DEBIT',
        'RTO_CHARGE',
        'WEIGHT_ADJUSTMENT',
        'REFUND',
        'COD_REMITTANCE_CREDIT',
        'MANUAL_CREDIT',
        'MANUAL_DEBIT'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE wallet_tx_direction AS ENUM ('CREDIT', 'DEBIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE shipment_mode AS ENUM ('B2C', 'B2B');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE shipment_payment_mode AS ENUM ('PREPAID', 'COD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE platform_shipment_status AS ENUM (
        'DRAFT',
        'BOOKED',
        'MANIFEST_GENERATED',
        'PICKUP_REQUESTED',
        'PICKUP_SCHEDULED',
        'PICKED_UP',
        'IN_TRANSIT',
        'REACHED_DESTINATION_HUB',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'NDR',
        'RTO_INITIATED',
        'RTO_IN_TRANSIT',
        'RTO_DELIVERED',
        'CANCELLED',
        'LOST',
        'DAMAGED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE ndr_status AS ENUM (
        'OPEN',
        'BUYER_ACTION_REQUIRED',
        'REATTEMPT_REQUESTED',
        'REATTEMPT_SCHEDULED',
        'RESOLVED',
        'RTO_INITIATED',
        'CLOSED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE rto_status AS ENUM (
        'RTO_INITIATED',
        'RTO_IN_TRANSIT',
        'RTO_DELIVERED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE cod_status AS ENUM (
        'PENDING_DELIVERY',
        'DELIVERED_ELIGIBLE',
        'PROCESSING_REMITTANCE',
        'REMITTED',
        'HELD'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE weight_discrepancy_status AS ENUM (
        'DETECTED',
        'MERCHANT_ACCEPTED',
        'DISPUTE_RAISED',
        'UNDER_REVIEW',
        'RESOLVED_IN_FAVOR_MERCHANT',
        'RESOLVED_IN_FAVOR_CARRIER',
        'AUTO_SETTLED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- PART 1: CORE OPERATIONAL ENTITIES (Phase 1 Baseline)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 MERCHANTS (Root Multi-Tenant Boundary)
-- Expl: Single source of truth for merchant companies. All operational data
--       must reference a valid merchant_id.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(255) NOT NULL,
    brand_logo_url TEXT,
    website_url VARCHAR(255),
    status merchant_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);

-- ----------------------------------------------------------------------------
-- 1.2 USERS (Merchant User Profiles mapped to Supabase auth.users)
-- Expl: Mapped 1:1 with Supabase GoTrue Auth via auth_user_id.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ----------------------------------------------------------------------------
-- 1.3 MERCHANT MEMBERS (Role-Based Access Control per Merchant)
-- Expl: Maps user identities to one or more merchants with specific roles.
--       Prevents recursive RLS and allows scalable team management.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role merchant_member_role NOT NULL DEFAULT 'MEMBER'::merchant_member_role,
    is_default BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_merchant_member UNIQUE (merchant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_merchant_members_merchant ON merchant_members(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_members_user ON merchant_members(user_id);

-- ----------------------------------------------------------------------------
-- 1.4 WAREHOUSES (Pickup Hubs)
-- Expl: Verified merchant origin hubs for courier dispatches.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    warehouse_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    landmark VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    pickup_start_time VARCHAR(20) DEFAULT '10:00 AM',
    pickup_end_time VARCHAR(20) DEFAULT '06:00 PM',
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_merchant_warehouse_code UNIQUE (merchant_id, warehouse_code)
);

CREATE INDEX IF NOT EXISTS idx_warehouses_merchant ON warehouses(merchant_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_pincode ON warehouses(pincode);

-- ----------------------------------------------------------------------------
-- 1.5 WALLETS (Prepaid Financial Balance in Minor Units)
-- Expl: Strictly enforces integer minor units (paise). ₹1.00 = 100.
--       Checks available_balance_minor >= 0 to block overdrafts at the DB level.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL UNIQUE REFERENCES merchants(id) ON DELETE CASCADE,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    available_balance_minor BIGINT NOT NULL DEFAULT 0 CHECK (available_balance_minor >= 0),
    reserved_balance_minor BIGINT NOT NULL DEFAULT 0 CHECK (reserved_balance_minor >= 0),
    total_recharged_minor BIGINT NOT NULL DEFAULT 0 CHECK (total_recharged_minor >= 0),
    total_spent_minor BIGINT NOT NULL DEFAULT 0 CHECK (total_spent_minor >= 0),
    total_refunded_minor BIGINT NOT NULL DEFAULT 0 CHECK (total_refunded_minor >= 0),
    low_balance_threshold_minor BIGINT NOT NULL DEFAULT 50000 CHECK (low_balance_threshold_minor >= 0), -- ₹500.00
    status wallet_status NOT NULL DEFAULT 'ACTIVE',
    version BIGINT NOT NULL DEFAULT 1, -- Optimistic concurrency counter
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallets_merchant ON wallets(merchant_id);

-- ----------------------------------------------------------------------------
-- 1.6 WALLET TRANSACTIONS (Immutable Financial Audit Ledger)
-- Expl: Append-only double-entry ledger. Every balance change produces exactly
--       one row. Enforces uniqueness on idempotency_key to prevent double-charging.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    type wallet_tx_type NOT NULL,
    direction wallet_tx_direction NOT NULL,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    balance_before_minor BIGINT NOT NULL CHECK (balance_before_minor >= 0),
    balance_after_minor BIGINT NOT NULL CHECK (balance_after_minor >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    reference_type VARCHAR(50) NOT NULL, -- e.g. 'SHIPMENT', 'PAYMENT_GATEWAY', 'ADJUSTMENT'
    reference_id VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_merchant ON wallet_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_reference ON wallet_transactions(reference_type, reference_id);

-- ----------------------------------------------------------------------------
-- 1.7 SHIPMENTS (Master Orders & Dispatches)
-- Expl: Single source of truth for all booked orders. Tracks both dead weight
--       and volumetric weight, financial charges, and current status.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    shipment_number VARCHAR(100) NOT NULL UNIQUE,
    booking_reference_id VARCHAR(255) NOT NULL UNIQUE,
    order_id VARCHAR(100) NOT NULL,
    awb_number VARCHAR(100),
    courier_id VARCHAR(50) NOT NULL,
    courier_name VARCHAR(100) NOT NULL,
    service_type VARCHAR(100) NOT NULL DEFAULT 'Surface',
    mode shipment_mode NOT NULL DEFAULT 'B2C',

    -- Pickup Origin Snapshot
    pickup_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    pickup_contact_person VARCHAR(255) NOT NULL,
    pickup_phone VARCHAR(30) NOT NULL,
    pickup_address_line1 TEXT NOT NULL,
    pickup_city VARCHAR(100) NOT NULL,
    pickup_state VARCHAR(100) NOT NULL,
    pickup_pincode VARCHAR(10) NOT NULL,

    -- Delivery Destination
    delivery_contact_name VARCHAR(255) NOT NULL,
    delivery_phone VARCHAR(30) NOT NULL,
    delivery_email VARCHAR(255),
    delivery_address_line1 TEXT NOT NULL,
    delivery_address_line2 TEXT,
    delivery_city VARCHAR(100) NOT NULL,
    delivery_state VARCHAR(100) NOT NULL,
    delivery_pincode VARCHAR(10) NOT NULL,

    -- Package Metrics
    total_packages_count INT NOT NULL DEFAULT 1 CHECK (total_packages_count > 0),
    actual_weight_kg NUMERIC(8,3) NOT NULL CHECK (actual_weight_kg > 0),
    chargeable_weight_kg NUMERIC(8,3) NOT NULL CHECK (chargeable_weight_kg > 0),
    package_contents_summary TEXT,

    -- Commercial Values & Mode
    invoice_number VARCHAR(100),
    invoice_date DATE,
    invoice_value_inr NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_mode shipment_payment_mode NOT NULL DEFAULT 'PREPAID',
    cod_amount_inr NUMERIC(12,2) NOT NULL DEFAULT 0.00,

    -- Monetary Charges in Minor Units (paise)
    freight_charge_minor BIGINT NOT NULL DEFAULT 0 CHECK (freight_charge_minor >= 0),
    fuel_surcharge_minor BIGINT NOT NULL DEFAULT 0 CHECK (fuel_surcharge_minor >= 0),
    cod_fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (cod_fee_minor >= 0),
    insurance_fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (insurance_fee_minor >= 0),
    gst_amount_minor BIGINT NOT NULL DEFAULT 0 CHECK (gst_amount_minor >= 0),
    total_charge_minor BIGINT NOT NULL CHECK (total_charge_minor >= 0),

    -- Status & URLs
    status platform_shipment_status NOT NULL DEFAULT 'BOOKED',
    carrier_status_raw VARCHAR(150),
    label_generated BOOLEAN NOT NULL DEFAULT false,
    label_download_url TEXT,
    manifest_id UUID, -- References manifests table (Part 2)
    booked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipments_merchant ON shipments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_shipments_awb ON shipments(awb_number);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_booked_at ON shipments(booked_at);

-- ----------------------------------------------------------------------------
-- 1.8 SHIPMENT PACKAGES (Itemized Boxes for Multi-Box Cargo)
-- Expl: Stores individual dimensions and dead weights for volumetric billing.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipment_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    package_number INT NOT NULL DEFAULT 1,
    box_type VARCHAR(50) DEFAULT 'Standard Carton',
    actual_weight_kg NUMERIC(8,3) NOT NULL CHECK (actual_weight_kg > 0),
    length_cm NUMERIC(8,2) NOT NULL CHECK (length_cm > 0),
    width_cm NUMERIC(8,2) NOT NULL CHECK (width_cm > 0),
    height_cm NUMERIC(8,2) NOT NULL CHECK (height_cm > 0),
    volumetric_weight_kg NUMERIC(8,3) NOT NULL CHECK (volumetric_weight_kg > 0),
    chargeable_weight_kg NUMERIC(8,3) NOT NULL CHECK (chargeable_weight_kg > 0),
    contents_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipment_packages_shipment ON shipment_packages(shipment_id);

-- ----------------------------------------------------------------------------
-- 1.9 SHIPMENT TRACKING EVENTS (Milestone Audit Trail)
-- Expl: Append-only event history normalized from courier webhooks or manual scans.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipment_tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    carrier_raw_status VARCHAR(150) NOT NULL,
    standard_status platform_shipment_status NOT NULL,
    location_city VARCHAR(100),
    location_hub VARCHAR(255),
    event_description TEXT NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'CARRIER_WEBHOOK', -- 'CARRIER_WEBHOOK', 'API_POLL', 'MANUAL'
    event_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment ON shipment_tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_timestamp ON shipment_tracking_events(event_timestamp);

-- ============================================================================
-- PART 2: LOGISTICS LIFECYCLE & EXCEPTION MODULES (Secondary Stage)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 MANIFESTS & MANIFEST ITEMS (Batch Handover Documents)
-- Expl: Groups booked parcels into a legal handover document for carrier pickup.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS manifests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    manifest_number VARCHAR(100) NOT NULL UNIQUE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    courier_id VARCHAR(50) NOT NULL,
    courier_name VARCHAR(100) NOT NULL,
    total_shipments_count INT NOT NULL DEFAULT 0,
    total_weight_kg NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    status VARCHAR(50) NOT NULL DEFAULT 'GENERATED', -- 'GENERATED', 'HANDED_OVER', 'CANCELLED'
    handover_at TIMESTAMPTZ,
    handover_person_name VARCHAR(255),
    carrier_agent_name VARCHAR(255),
    carrier_agent_phone VARCHAR(30),
    manifest_document_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manifests_merchant ON manifests(merchant_id);

CREATE TABLE IF NOT EXISTS manifest_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manifest_id UUID NOT NULL REFERENCES manifests(id) ON DELETE CASCADE,
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE RESTRICT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_manifest_shipment UNIQUE (manifest_id, shipment_id)
);

CREATE INDEX IF NOT EXISTS idx_manifest_items_manifest ON manifest_items(manifest_id);

-- ----------------------------------------------------------------------------
-- 2.2 PICKUP REQUESTS (Carrier Scheduled Visits)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pickup_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    pickup_request_number VARCHAR(100) NOT NULL UNIQUE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    courier_id VARCHAR(50) NOT NULL,
    courier_name VARCHAR(100) NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time_slot VARCHAR(50) NOT NULL,
    expected_package_count INT NOT NULL CHECK (expected_package_count > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED', -- 'REQUESTED', 'SCHEDULED', 'PICKED_UP', 'CANCELLED'
    carrier_pickup_token VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pickups_merchant ON pickup_requests(merchant_id);

-- ----------------------------------------------------------------------------
-- 2.3 NDR RECORDS (Non-Delivery Reports)
-- Expl: Tracks failed delivery attempts and records buyer re-attempt instructions.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ndr_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    shipment_id UUID NOT NULL UNIQUE REFERENCES shipments(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL DEFAULT 1 CHECK (attempt_number > 0),
    ndr_reason TEXT NOT NULL,
    carrier_comment TEXT,
    status ndr_status NOT NULL DEFAULT 'BUYER_ACTION_REQUIRED',
    buyer_action_requested VARCHAR(100),
    reschedule_date DATE,
    updated_delivery_address TEXT,
    updated_phone VARCHAR(30),
    payment_link_url TEXT,
    payment_link_status VARCHAR(50) DEFAULT 'NONE', -- 'NONE', 'GENERATED', 'PAID'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ndr_merchant ON ndr_records(merchant_id);

-- ----------------------------------------------------------------------------
-- 2.4 RTO RECORDS (Return to Origin)
-- Expl: Tracks packages returning to origin warehouse and applicable return fees.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rto_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    shipment_id UUID NOT NULL UNIQUE REFERENCES shipments(id) ON DELETE CASCADE,
    rto_reason TEXT NOT NULL,
    status rto_status NOT NULL DEFAULT 'RTO_INITIATED',
    rto_charge_minor BIGINT NOT NULL DEFAULT 0 CHECK (rto_charge_minor >= 0),
    rto_awb_number VARCHAR(100),
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rto_merchant ON rto_records(merchant_id);

-- ----------------------------------------------------------------------------
-- 2.5 WEIGHT DISCREPANCIES (Audit Discrepancies & Dispute Flow)
-- Expl: Reconciles carrier scanned dead/volumetric weight against booked weight.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weight_discrepancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    entered_weight_kg NUMERIC(8,3) NOT NULL,
    carrier_scanned_weight_kg NUMERIC(8,3) NOT NULL,
    excess_weight_kg NUMERIC(8,3) NOT NULL,
    additional_charge_minor BIGINT NOT NULL CHECK (additional_charge_minor >= 0),
    status weight_discrepancy_status NOT NULL DEFAULT 'DETECTED',
    auto_settlement_deadline TIMESTAMPTZ NOT NULL,
    merchant_dispute_reason TEXT,
    carrier_proof_image_url TEXT,
    merchant_proof_image_url TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weight_discrepancies_merchant ON weight_discrepancies(merchant_id);

-- ----------------------------------------------------------------------------
-- 2.6 COD RECEIVABLES & REMITTANCES
-- Expl: Tracks Cash-on-Delivery collections and automated merchant payouts.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cod_remittances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    remittance_number VARCHAR(100) NOT NULL UNIQUE,
    total_shipments_count INT NOT NULL CHECK (total_shipments_count > 0),
    gross_collected_minor BIGINT NOT NULL CHECK (gross_collected_minor >= 0),
    deductions_minor BIGINT NOT NULL DEFAULT 0 CHECK (deductions_minor >= 0),
    early_cod_fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (early_cod_fee_minor >= 0),
    net_payout_minor BIGINT NOT NULL CHECK (net_payout_minor >= 0),
    payout_mode VARCHAR(20) NOT NULL DEFAULT 'BANK_TRANSFER',
    bank_reference_utr VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING', -- 'PROCESSING', 'REMITTED', 'FAILED'
    remitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cod_remittances_merchant ON cod_remittances(merchant_id);

CREATE TABLE IF NOT EXISTS cod_receivables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    shipment_id UUID NOT NULL UNIQUE REFERENCES shipments(id) ON DELETE CASCADE,
    remittance_id UUID REFERENCES cod_remittances(id) ON DELETE SET NULL,
    cod_amount_minor BIGINT NOT NULL CHECK (cod_amount_minor >= 0),
    cod_fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (cod_fee_minor >= 0),
    status cod_status NOT NULL DEFAULT 'PENDING_DELIVERY',
    delivered_at TIMESTAMPTZ,
    eligible_for_payout_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cod_receivables_merchant ON cod_receivables(merchant_id);

-- ============================================================================
-- PART 3: COMMERCIAL & COMPLIANCE EXTENSIONS (Tertiary Stage)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 CARRIER RATE CARDS & CUSTOMER RATE ASSIGNMENTS
-- Expl: Stores custom B2B/B2C zone-based matrix pricing.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carrier_rate_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_card_code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    mode shipment_mode NOT NULL DEFAULT 'B2C',
    courier_id VARCHAR(50) NOT NULL,
    courier_name VARCHAR(100) NOT NULL,
    base_weight_grams INT NOT NULL DEFAULT 500,
    base_rate_within_city_minor BIGINT NOT NULL,
    base_rate_within_state_minor BIGINT NOT NULL,
    base_rate_metro_minor BIGINT NOT NULL,
    base_rate_rest_of_india_minor BIGINT NOT NULL,
    base_rate_special_zone_minor BIGINT NOT NULL,
    additional_weight_grams INT NOT NULL DEFAULT 500,
    additional_rate_within_city_minor BIGINT NOT NULL,
    additional_rate_within_state_minor BIGINT NOT NULL,
    additional_rate_metro_minor BIGINT NOT NULL,
    additional_rate_rest_of_india_minor BIGINT NOT NULL,
    additional_rate_special_zone_minor BIGINT NOT NULL,
    cod_flat_fee_minor BIGINT NOT NULL DEFAULT 4000, -- ₹40.00
    cod_percent NUMERIC(5,2) NOT NULL DEFAULT 2.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merchant_rate_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    rate_card_id UUID NOT NULL REFERENCES carrier_rate_cards(id) ON DELETE CASCADE,
    mode shipment_mode NOT NULL DEFAULT 'B2C',
    is_default BOOLEAN NOT NULL DEFAULT false,
    custom_markup_minor BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_merchant_rate_card UNIQUE (merchant_id, rate_card_id)
);

CREATE INDEX IF NOT EXISTS idx_rate_assignments_merchant ON merchant_rate_assignments(merchant_id);

-- ----------------------------------------------------------------------------
-- 3.2 MERCHANT BANK ACCOUNTS & KYC DOCUMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchant_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    account_holder_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    account_type VARCHAR(20) NOT NULL DEFAULT 'CURRENT',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,
    is_default BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_merchant ON merchant_bank_accounts(merchant_id);

CREATE TABLE IF NOT EXISTS merchant_kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'GST_CERTIFICATE', 'COMPANY_PAN', 'SIGNATORY_AADHAAR', 'CANCELLED_CHEQUE'
    document_file_name VARCHAR(255) NOT NULL,
    document_storage_path TEXT NOT NULL,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'REJECTED'
    rejection_reason TEXT,
    verified_at TIMESTAMPTZ,
    verified_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kyc_docs_merchant ON merchant_kyc_documents(merchant_id);

-- ----------------------------------------------------------------------------
-- 3.3 GST FREIGHT INVOICES (Tax Documents)
-- Expl: Legal entity details for the platform are kept UNCONFIRMED per safety rules.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gst_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    total_shipments_count INT NOT NULL DEFAULT 0,
    taxable_freight_minor BIGINT NOT NULL CHECK (taxable_freight_minor >= 0),
    cgst_amount_minor BIGINT NOT NULL DEFAULT 0 CHECK (cgst_amount_minor >= 0),
    sgst_amount_minor BIGINT NOT NULL DEFAULT 0 CHECK (sgst_amount_minor >= 0),
    igst_amount_minor BIGINT NOT NULL DEFAULT 0 CHECK (igst_amount_minor >= 0),
    total_invoice_amount_minor BIGINT NOT NULL CHECK (total_invoice_amount_minor >= 0),
    invoice_pdf_url TEXT,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PAID_VIA_WALLET',
    legal_platform_profile_status VARCHAR(50) NOT NULL DEFAULT 'UNCONFIRMED_PENDING_OWNER_INPUT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gst_invoices_merchant ON gst_invoices(merchant_id);

-- ----------------------------------------------------------------------------
-- 3.4 SYSTEM AUDIT LOGS (Compliance & Security Audits)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    details_json JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_merchant ON audit_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
