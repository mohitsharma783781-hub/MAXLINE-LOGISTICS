# MAXLINE LOGISTICS — BUG REGISTER & RESOLUTION LOG

This document provides a comprehensive, chronological register of all defects, race conditions, edge-case failures, schema mismatches, and synchronization anomalies identified during the master system audit of MAXLINE LOGISTICS, together with their root cause analysis and resolution status.

---

## Bug Severity Definitions

- **P0 (Critical / Blocker):** System crash, financial corruption, inability to register/login, unauthorized data exposure, duplicate credit risk.
- **P1 (High):** Core workflow failure (e.g., wallet recharge failure, inability to book shipments, KYC status blocking onboarding).
- **P2 (Medium):** UI synchronization delay, missing fields in table views, caching discrepancy between tabs/sessions.
- **P3 (Low):** Visual styling inconsistencies, minor label alignment, non-breaking cosmetic flaws.

---

## Master Defect Register

| Bug ID | Severity | Module | Description | Root Cause | Affected Files | Resolution Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | **P0** | Payments / Wallet | Razorpay recharge verification failed to credit newly registered merchants | `api/verify-payment.js` assumed a wallet row already existed. If the merchant was newly registered without an active wallet row, the balance update was silently skipped. | `api/verify-payment.js` | **RESOLVED**: Added auto-provisioning logic that dynamically creates a fresh wallet row with the credited balance and audit ledger entry if not previously present. |
| **BUG-02** | **P0** | Payments / Security | Potential duplicate wallet crediting on network retries | `api/verify-payment.js` lacked idempotency validation on `razorpay_payment_id`. Multiple webhook hits or rapid retries could have credited the merchant twice. | `api/verify-payment.js` | **RESOLVED**: Implemented strict idempotency query checking `wallet_transactions.reference_id`. Duplicate hits return HTTP 200 with idempotent acknowledgment without double-crediting. |
| **BUG-03** | **P1** | Database / Enum | PostgreSQL transaction type enum mismatch on freight debit | `SupabaseWalletService.ts` passed `type: 'SHIPMENT_CHARGE'`, but PostgreSQL Supabase enum `wallet_tx_type` only permits `FREIGHT_DEBIT`, `RECHARGE`, `COD_REMITTANCE`, etc., causing direct DB debits to throw constraint violations. | `apps/dashboard/src/services/supabase/supabaseWalletService.ts` | **RESOLVED**: Aligned enum value to schema-compliant `FREIGHT_DEBIT`. |
| **BUG-04** | **P1** | Admin Portal | `ReferenceError: useEffect is not defined` on `/admin/onboarding` | `AdminOnboardingTrackerPage.tsx` invoked `useEffect` in the component body to query live cloud merchants, but `useEffect` was omitted from the React import statement. | `apps/dashboard/src/pages/admin/AdminOnboardingTrackerPage.tsx` | **RESOLVED**: Added `useEffect` to React imports. Built and verified cleanly in Vite. |
| **BUG-05** | **P1** | Admin Portal | Legacy demo onboarding records obscured real merchant onboarding | `OnboardingService.getRecords()` loaded legacy demo records from browser localStorage (`CUST-1001` through `CUST-1005`, Apex, Zenith) without pruning them when fresh merchants were registered. | `apps/dashboard/src/services/onboardingService.ts`, `apps/dashboard/src/main.tsx` | **RESOLVED**: Added automatic demo record filter in `getRecords()` and client-side purge in `main.tsx` to sanitize browser state. |
| **BUG-06** | **P1** | Compliance / KYC | Super Admin KYC document approval failed on UUID tenants | `AdminKycVerificationPage.tsx` attempted `selectedRecord.id.replace('cust-', 'CUST-100')`, corrupting RFC 4122 UUIDs and failing to update the onboarding state. | `apps/dashboard/src/pages/admin/AdminKycVerificationPage.tsx` | **RESOLVED**: Passed authoritative `selectedRecord.id` directly to `OnboardingService.markStageComplete` and synced status to Supabase PostgreSQL. |
| **BUG-07** | **P2** | Seller Portal | Topbar wallet balance out of sync with external credits | `Topbar.tsx` only initialized the balance pill on component mount. Credits executed in another tab or via Razorpay webhook were not reflected until a hard page reload. | `apps/dashboard/src/components/common/Topbar.tsx` | **RESOLVED**: Added window `focus` event listener and 15-second background polling against Supabase cloud balance. |
| **BUG-08** | **P2** | Admin Portal | Customer 360 Detail page crashed on missing merchant reference | `AdminCustomerDetailPage.tsx` referenced `foundMerchant` variable which was undefined when viewing newly registered merchants. | `apps/dashboard/src/pages/admin/AdminCustomerDetailPage.tsx` | **RESOLVED**: Normalized lookup to `id || merchantItem?.id || ''` with defensive null-checks. |
| **BUG-09** | **P2** | Seller Portal | Wallet page cached stale local storage balance after top-up | `WalletPage.tsx` and `WalletRechargeWizardPage.tsx` displayed previous local state without awaiting cloud balance synchronization. | `apps/dashboard/src/pages/app/WalletPage.tsx`, `WalletRechargeWizardPage.tsx` | **RESOLVED**: Wired `WalletService.syncFromSupabase(tenantId)` immediately upon successful payment callback before navigating. |
| **BUG-10** | **P3** | Build / Runtime | Syntax error in `main.tsx` due to extraneous closing brace | Stray brace at end of `try...catch` block in `main.tsx` caused Vite build failure. | `apps/dashboard/src/main.tsx` | **RESOLVED**: Cleaned up syntax; build verified across 2,096 modules in 10.57s. |

---

## Defect Summary Statistics

- **Total Bugs Logged:** 10
- **Total P0 (Blockers):** 2 (Resolved: 2, 100%)
- **Total P1 (High):** 4 (Resolved: 4, 100%)
- **Total P2 (Medium):** 3 (Resolved: 3, 100%)
- **Total P3 (Low):** 1 (Resolved: 1, 100%)
- **Current Open Defects:** 0
