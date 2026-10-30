-- ============================================================================
-- SKYONSHIP LOGISTICS PORTAL — SUPABASE IDENTITY & MULTI-TENANCY FOUNDATION
-- Migration: 004_secure_identity_foundation.sql
-- Description:
--   1. Harden get_auth_tenant_id() to eliminate demo tenant fallback (Fail-Closed)
--      and reject mismatched/stale JWT app_metadata claims against public.users.
--   2. Install atomic, server-controlled customer provisioning trigger on auth.users.
--   3. Validate wallet structural integrity on conflict; preserve balances.
--   4. Strictly prevent orphan tenants, account takeover, and duplicate tenant generation.
--   5. Enable tenant self-management policies (UPDATE on tenants table).
--   6. Allow users to read their own user profile (OR auth_user_id = auth.uid()).
-- Security: Grants execute to anon so RLS expressions evaluate cleanly to NULL
--           without throwing fatal 403 function permission errors.
-- Idempotency: 100% safe to run repeatedly without duplicate rows or destructive loss.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HARDEN get_auth_tenant_id() (STRICT MULTI-TENANT ISOLATION & CLAIM VALIDATION)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS UUID AS $$
DECLARE
    v_db_tenant_id UUID;
    v_jwt_tenant_id UUID;
BEGIN
    -- 1. Unauthenticated or Anonymous requests immediately return NULL (Fail-Closed)
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    -- 2. Query authoritative tenant mapping directly from public.users table
    SELECT u.tenant_id INTO v_db_tenant_id
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    LIMIT 1;

    -- If authenticated user has no record or unassigned tenant in public.users, fail closed
    IF v_db_tenant_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- 3. Extract tenant_id claim from JWT app_metadata (if present)
    -- Client-modifiable user_metadata is NEVER inspected.
    BEGIN
        v_jwt_tenant_id := (NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', ''))::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_jwt_tenant_id := NULL;
    END;

    -- 4. Anti-Tamper / Mismatch Check:
    -- If the JWT contains a tenant claim, it MUST match the authoritative database tenant.
    -- Stale, revoked, or mismatched tokens are strictly rejected.
    IF v_jwt_tenant_id IS NOT NULL AND v_jwt_tenant_id <> v_db_tenant_id THEN
        RETURN NULL;
    END IF;

    -- Return verified authoritative tenant UUID. NEVER default to demo tenant!
    RETURN v_db_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;

-- Retain grant to anon so RLS policies on tables evaluate cleanly to empty set instead of throwing 403
GRANT EXECUTE ON FUNCTION public.get_auth_tenant_id() TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. ATOMIC CUSTOMER PROVISIONING TRIGGER ON SIGNUP
-- Automatically creates Tenant, User Profile, and Wallet upon auth.users creation.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
DECLARE
    v_existing_tenant_id UUID;
    v_conflicting_user_id UUID;
    v_wallet_record RECORD;
    new_tenant_id UUID;
    new_user_id UUID;
    v_business_name TEXT;
    v_full_name TEXT;
    v_phone TEXT;
    v_email TEXT;
BEGIN
    -- Defensive string normalization and length safety
    v_email := lower(substr(TRIM(COALESCE(NEW.email, NEW.id::text || '@skyonship.local')), 1, 255));
    
    v_business_name := substr(TRIM(COALESCE(NULLIF(NEW.raw_user_meta_data->>'business_name', ''), 'My Logistics Hub')), 1, 255);
    IF v_business_name = '' THEN
        v_business_name := 'My Logistics Hub';
    END IF;

    v_full_name := substr(TRIM(COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(v_email, '@', 1), 'Merchant Admin')), 1, 255);
    IF v_full_name = '' THEN
        v_full_name := 'Merchant Admin';
    END IF;

    v_phone := substr(TRIM(COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone_number', ''), '')), 1, 30);
    IF v_phone = '' THEN
        v_phone := NULL;
    END IF;

    -- ------------------------------------------------------------------------
    -- STEP 1: IDEMPOTENCY CHECK (AUTHORITATIVE MAPPING ALREADY EXISTS)
    -- ------------------------------------------------------------------------
    -- If a user profile already exists for this auth_user_id (e.g., trigger retry or replay),
    -- NEVER create a second tenant. Re-use existing tenant, self-heal wallet if missing,
    -- validate wallet integrity, sync app_metadata, and return cleanly.
    SELECT tenant_id INTO v_existing_tenant_id 
    FROM public.users 
    WHERE auth_user_id = NEW.id 
    LIMIT 1;

    IF v_existing_tenant_id IS NOT NULL THEN
        -- Self-heal: ensure wallet exists for existing tenant, NEVER resetting balance
        INSERT INTO public.wallets (
            id,
            tenant_id,
            currency,
            available_balance_minor,
            reserved_balance_minor,
            total_spent_minor,
            total_refunded_minor,
            low_balance_threshold_minor,
            status,
            version,
            created_at,
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            v_existing_tenant_id,
            'INR',
            0,
            0,
            0,
            0,
            50000,
            'ACTIVE',
            1,
            NOW(),
            NOW()
        )
        ON CONFLICT (tenant_id) DO NOTHING;

        -- Verify existing wallet structural integrity without modifying balances
        SELECT id, currency, available_balance_minor, reserved_balance_minor, status
        INTO v_wallet_record
        FROM public.wallets
        WHERE tenant_id = v_existing_tenant_id;

        IF v_wallet_record.id IS NULL THEN
            RAISE EXCEPTION 'Wallet verification failed: no wallet row exists for tenant %', v_existing_tenant_id;
        END IF;

        IF v_wallet_record.currency <> 'INR' OR v_wallet_record.available_balance_minor < 0 OR v_wallet_record.reserved_balance_minor < 0 THEN
            RAISE EXCEPTION 'Wallet integrity violation: invalid wallet state for tenant % (currency: %, available: %, reserved: %)',
                v_existing_tenant_id, v_wallet_record.currency, v_wallet_record.available_balance_minor, v_wallet_record.reserved_balance_minor;
        END IF;

        -- Ensure auth.users has app_metadata populated with authoritative tenant
        UPDATE auth.users
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
            'tenant_id', v_existing_tenant_id::text,
            'role', 'MERCHANT_ADMIN'
        )
        WHERE id = NEW.id;

        RETURN NEW;
    END IF;

    -- If a row exists for this auth_user_id with NULL tenant_id (corrupt state), abort safely
    IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = NEW.id) THEN
        RAISE EXCEPTION 'Corrupt profile detected: public.users record exists for auth_user_id % without a valid tenant_id', NEW.id;
    END IF;

    -- ------------------------------------------------------------------------
    -- STEP 2: ANTI-ACCOUNT-TAKEOVER & EMAIL COLLISION SAFETY
    -- ------------------------------------------------------------------------
    -- Check if ANY row in public.users already has this email (case-insensitive).
    -- Since Step 1 already verified this auth_user_id does not own it, any match here
    -- represents either:
    --   (a) an account belonging to a different auth_user_id, OR
    --   (b) an unlinked/invited profile where auth_user_id IS NULL.
    -- In either case, we MUST NOT silently link to this account, MUST NOT overwrite it,
    -- and MUST NOT create an orphan tenant. We strictly reject the signup.
    SELECT id INTO v_conflicting_user_id
    FROM public.users
    WHERE lower(email) = v_email
    LIMIT 1;

    IF v_conflicting_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'A user profile with email "%" already exists for another account or unlinked profile (user_id: %). Registration rejected.', 
            v_email, v_conflicting_user_id
            USING ERRCODE = 'unique_violation';
    END IF;

    -- ------------------------------------------------------------------------
    -- STEP 3: PROVISION NEW ISOLATED TENANT
    -- ------------------------------------------------------------------------
    INSERT INTO public.tenants (
        id,
        company_name,
        status,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        v_business_name,
        'ACTIVE',
        NOW(),
        NOW()
    )
    RETURNING id INTO new_tenant_id;

    -- ------------------------------------------------------------------------
    -- STEP 4: PROVISION USER PROFILE (STRICT ATOMICITY — NO ON CONFLICT DO NOTHING)
    -- ------------------------------------------------------------------------
    -- We deliberately avoid "ON CONFLICT DO NOTHING". A skipped user insert would leave
    -- an orphan tenant and cause a misassociated wallet. The insert MUST succeed.
    -- If a conflict occurs, PostgreSQL raises an exception and cleanly rolls back the
    -- newly created tenant in Step 3.
    INSERT INTO public.users (
        id,
        tenant_id,
        auth_user_id,
        full_name,
        email,
        phone,
        role,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        new_tenant_id,
        NEW.id,
        v_full_name,
        v_email,
        v_phone,
        'MERCHANT_ADMIN',
        NOW(),
        NOW()
    )
    RETURNING id INTO new_user_id;

    IF new_user_id IS NULL THEN
        RAISE EXCEPTION 'Atomic provisioning failed: public.users record could not be created for auth_user_id %', NEW.id;
    END IF;

    -- ------------------------------------------------------------------------
    -- STEP 5: PROVISION ISOLATED EMPTY WALLET (₹0.00 Balance, Version 1)
    -- ------------------------------------------------------------------------
    INSERT INTO public.wallets (
        id,
        tenant_id,
        currency,
        available_balance_minor,
        reserved_balance_minor,
        total_spent_minor,
        total_refunded_minor,
        low_balance_threshold_minor,
        status,
        version,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        new_tenant_id,
        'INR',
        0,
        0,
        0,
        0,
        50000, -- ₹500.00 alert threshold
        'ACTIVE',
        1,     -- Optimistic lock initial version
        NOW(),
        NOW()
    )
    ON CONFLICT (tenant_id) DO NOTHING;

    -- Verify newly provisioned wallet structural integrity and zero initial balance
    SELECT id, currency, available_balance_minor, reserved_balance_minor, status
    INTO v_wallet_record
    FROM public.wallets
    WHERE tenant_id = new_tenant_id;

    IF v_wallet_record.id IS NULL THEN
        RAISE EXCEPTION 'Wallet verification failed: no wallet could be created for new tenant %', new_tenant_id;
    END IF;

    -- A newly provisioned tenant MUST start with an exact ₹0 balance
    IF v_wallet_record.available_balance_minor <> 0 OR v_wallet_record.reserved_balance_minor <> 0 THEN
        RAISE EXCEPTION 'Wallet conflict violation: pre-existing non-zero balance detected for newly generated tenant %', new_tenant_id;
    END IF;

    IF v_wallet_record.currency <> 'INR' OR v_wallet_record.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'Wallet conflict violation: unexpected currency (%) or status (%) for new tenant %',
            v_wallet_record.currency, v_wallet_record.status, new_tenant_id;
    END IF;

    -- ------------------------------------------------------------------------
    -- STEP 6: SET TRUSTED APP_METADATA FOR JWT SESSION TOKENS
    -- ------------------------------------------------------------------------
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
        'tenant_id', new_tenant_id::text,
        'role', 'MERCHANT_ADMIN'
    )
    WHERE id = NEW.id;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_auth_user() for auth_user_id %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, auth;

-- Bind Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- 3. ENHANCE RLS POLICIES FOR TENANTS & USERS SELF-MANAGEMENT
-- ----------------------------------------------------------------------------
-- Allow users to view their own profile even before app_metadata is in token
DROP POLICY IF EXISTS users_select_policy ON users;
CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (
        tenant_id = get_auth_tenant_id()
        OR auth_user_id = auth.uid()
    );

-- Allow merchant admins to update their own company profile details
DROP POLICY IF EXISTS tenant_update_policy ON tenants;
CREATE POLICY tenant_update_policy ON tenants
    FOR UPDATE
    USING (id = get_auth_tenant_id())
    WITH CHECK (id = get_auth_tenant_id());
