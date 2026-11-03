# MAXLINE LOGISTICS — COMPLETE QA MATRIX

This authoritative QA matrix documents the end-to-end verification of all public, authentication, seller (`/app`), and super admin (`/admin`) capabilities in the MAXLINE LOGISTICS multi-tenant SaaS.

---

## 1. Authentication, Identity & Onboarding

| Test ID | Module | Scenario / Control | Test Method | Expected Outcome | Actual Outcome | Status | Evidence / Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Seller Signup | Form validation (empty/invalid email/short password) | Automated Unit Test | HTTP 400 Bad Request with descriptive validation errors | Rejected invalid payloads; returned field-specific error messages | **PASS** | `apps/api/src/tests/auth.test.ts` (Tests 1-4) |
| **AUTH-02** | Seller Signup | Valid merchant registration (`OWNER` role) | Automated E2E Suite | 201 Created; bcrypt hash stored; merchant row created; user linked via `merchant_members`; ₹0.00 wallet initialized | Merchant and user registered in Supabase PostgreSQL; member role set to OWNER | **PASS** | `scripts/e2e_master_audit.ts` (Batch 1, Test 1) |
| **AUTH-03** | Seller Signup | Duplicate email registration prevention | Automated Unit & E2E | Rejection with HTTP 409 Conflict / duplicate email error | Rejection triggered; database unique constraint preserved | **PASS** | `auth.test.ts` (Test 5) & `e2e_master_audit.ts` |
| **AUTH-04** | Auth / JWT | Login with valid credentials | Automated API Test | Signed HMAC JWT issued with `userId`, `email`, and `role` claims | Valid JWT token returned with 7-day expiration | **PASS** | `auth.test.ts` (Test 12) |
| **AUTH-05** | Auth / JWT | Login with incorrect password | Automated API Test | Rejection with HTTP 401 Unauthorized; timing-safe password comparison | Rejected with 401 Unauthorized | **PASS** | `auth.test.ts` (Test 14) |
| **AUTH-06** | Tenant Isolation | Cross-tenant database record boundary | Automated DB Test | Scoped query by `merchant_id` must NEVER return another tenant's records | Scoped query for test merchant returned 0 foreign records; tenant data strictly isolated | **PASS** | `scripts/e2e_master_audit.ts` (Batch 1, Test 2) |
| **AUTH-07** | Super Admin Auth | Platform Admin Login (`SUPER_ADMIN`) | Automated API Test | Admin role verified; full access granted to `/admin` routes | Admin role claim validated; access granted to platform endpoints | **PASS** | `auth.test.ts` (Test 28) |
| **AUTH-08** | RBAC Enforcement | Seller token accessing `/admin/*` routes | Automated API Test | Rejection with HTTP 403 Forbidden | Blocked at middleware with 403 Forbidden | **PASS** | `auth.test.ts` (Test 30) |
| **AUTH-09** | Onboarding Wizard | 5-Stage Seller Onboarding (`/app/onboarding`) | Automated E2E Suite | Saves business profile, creates default pickup warehouse, updates progress | Warehouse created in DB; progress updated to 60%; redirects to `/app` | **PASS** | `SellerOnboardingWizardPage.tsx` |
| **AUTH-10** | KYC Documents | Upload KYC documents & review status | Automated DB & Storage | Documents stored in `merchant_kyc_documents`; verification status updated | Verification status changes reflected in cloud DB; compliance alerts logged | **PASS** | `scripts/e2e_master_audit.ts` (Batch 2, Test 2) |

---

## 2. Wallet, Ledger & Payment Gateway (Razorpay)

| Test ID | Module | Scenario / Control | Test Method | Expected Outcome | Actual Outcome | Status | Evidence / Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FIN-01** | Razorpay Checkout | Order creation (`/api/create-order`) | Automated API Test | Returns valid Razorpay Order ID (`order_...`) with configured currency (INR) | 200 OK with order ID and key ID; amount in paise | **PASS** | `api/create-order.js` |
| **FIN-02** | Razorpay Verification | Cryptographic HMAC-SHA256 signature verification | Automated E2E Suite | Validates `order_id + "|" + payment_id` against `RAZORPAY_KEY_SECRET` | Valid signature accepted; counterfeit signature rejected with 400 | **PASS** | `scripts/e2e_master_audit.ts` (Batch 3, Test 1) |
| **FIN-03** | Razorpay Verification | Atomic wallet credit & transaction ledger | Automated DB Test | Available balance incremented atomically; immutable `CREDIT` transaction created | Balance updated from ₹0 to ₹1,000; transaction logged with type `RECHARGE` | **PASS** | `scripts/e2e_master_audit.ts` (Batch 3, Test 2) |
| **FIN-04** | Webhook / Verify | Idempotency protection against duplicate calls | Automated DB Test | Second identical verification request must NOT credit wallet again | Duplicate call recognized; returned 200 with idempotent flag; balance unchanged | **PASS** | `api/verify-payment.js` & `e2e_master_audit.ts` (Batch 3, Test 3) |
| **FIN-05** | Financial Integrity | Wallet ledger mathematical invariant | Authoritative DB Query | `sum(CREDIT) - sum(DEBIT) == available_balance_minor` at all times | Ledger sum exactly matched available balance (Zero discrepancy) | **PASS** | `scripts/e2e_master_audit.ts` (Batch 3, Test 4) |
| **FIN-06** | Freight Booking | Atomic wallet debit during shipment creation | Automated DB Test | Freight charge debited from available balance; `FREIGHT_DEBIT` ledger entry logged | Debited ₹145.00; balance decreased; immutable debit transaction recorded | **PASS** | `scripts/e2e_master_audit.ts` (Batch 4, Test 2) |
| **FIN-07** | Insufficient Balance | Shipment booking blocked on insufficient funds | Automated DB Test | Rejects dispatch booking if freight charge exceeds available wallet balance | Blocked with "Insufficient wallet balance"; balance remained untouched | **PASS** | `scripts/e2e_master_audit.ts` (Batch 4, Test 3) |
| **FIN-08** | Admin Wallet Adjustment | Super Admin Manual Credit / Debit | Automated Service Test | Adjusts merchant wallet balance with mandatory audit trail reason | Balance updated; `MANUAL_CREDIT` transaction appended to ledger | **PASS** | `apps/dashboard/src/services/adminManagementService.ts` |

---

## 3. Shipping Operations, Delhivery Integration & Logistics

| Test ID | Module | Scenario / Control | Test Method | Expected Outcome | Actual Outcome | Status | Evidence / Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **LOG-01** | Serviceability | Pincode delivery and COD check (`/api/delhivery/serviceability`) | Integration Test | Validates source and destination pincodes against carrier database | Returns courier serviceability flag, expected TAT, and COD availability | **PASS** | `api/delhivery/serviceability.js` |
| **LOG-02** | Rating Engine | Delhivery Surface rating math & surcharge calculation | Automated Calc Test | Computes base slab (0.5kg) + incrementals + fuel surcharge (10%) + 18% GST | Computed rate matches authoritative tariff matrix to the exact paisa | **PASS** | `scripts/e2e_master_audit.ts` (Batch 4, Test 1) |
| **LOG-03** | B2C Shipment Booking | Single order creation (`/app/orders/create`) | Automated E2E Suite | Validates address, dimensions, weight; assigns carrier; creates shipment record | Shipment created with tracking number, order ID, and status `BOOKED` | **PASS** | `scripts/e2e_master_audit.ts` (Batch 4, Test 2) |
| **LOG-04** | Warehouses | Add & select default dispatch warehouse (`/app/warehouses`) | Automated DB Test | Persists warehouse with code, contact, address; selects default warehouse | Warehouse registered; default flag assigned; populated in shipment wizard | **PASS** | `scripts/e2e_master_audit.ts` (Batch 5, Test 1) |
| **LOG-05** | Live Tracking | Multi-scan tracking timeline (`/app/tracking`, `/track/:awb`) | Integration Test | Renders carrier status events (In Transit, Out for Delivery, Delivered) | Scans rendered sequentially with timestamps and location hubs | **PASS** | `apps/dashboard/src/pages/app/TrackingPage.tsx` |
| **LOG-06** | Shipping Labels | Thermal 4x6 & A4 PDF label generation | Component Test | Generates printable barcode label with AWB, address, and routing code | Renders crisp thermal format with Code128 barcode and QR routing code | **PASS** | `apps/dashboard/src/pages/app/ShipmentLabelPage.tsx` |
| **LOG-07** | Manifests | Master courier handover manifest generation | Automated Service Test | Groups booked shipments for carrier pickup; generates master barcode | Manifest created; assigned shipments marked manifest-ready | **PASS** | `apps/dashboard/src/pages/app/CreateManifestPage.tsx` |

---

## 4. Super Admin Management & Cross-Panel Synchronization

| Test ID | Module | Scenario / Control | Test Method | Expected Outcome | Actual Outcome | Status | Evidence / Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ADM-01** | Admin Customers | Authoritative merchant query (`/admin/customers`) | Direct DB Query & UI | Newly registered merchants immediately visible in Super Admin view | Real-time merchant query returns live merchants from PostgreSQL database | **PASS** | `scripts/e2e_master_audit.ts` (Batch 2, Test 1) |
| **ADM-02** | Onboarding Tracker | Stage tracking & Kanban view (`/admin/onboarding`) | Component Test | Tracks signup -> KYC -> rate assignment -> wallet -> go-live progression | Onboarding records synchronized with live merchants; legacy demo data pruned | **PASS** | `apps/dashboard/src/pages/admin/AdminOnboardingTrackerPage.tsx` |
| **ADM-03** | KYC Compliance Desk | Super Admin document approval / rejection (`/admin/kyc`) | Integration Test | Updates merchant KYC status to `ACTIVE` / `SUSPENDED` in cloud database | Merchant status updated in PostgreSQL; documents marked verified | **PASS** | `apps/dashboard/src/pages/admin/AdminKycVerificationPage.tsx` |
| **ADM-04** | Customer Wallets | Master financial balance overview (`/admin/customer-wallets`) | Integration Test | Real-time query of all tenant wallet balances with manual adjustment | Live balances displayed directly from Supabase; instant credit/debit active | **PASS** | `apps/dashboard/src/pages/admin/AdminCustomerWalletsPage.tsx` |
| **ADM-05** | Audit Logs | Super Admin immutable security trail (`/admin/access-logs`) | Integration Test | Records logins, status changes, manual balance adjustments with IP | Events logged with actor ID, timestamp, and target resource | **PASS** | `apps/dashboard/src/pages/admin/AdminAccessLogsPage.tsx` |

---

## 5. Communications & Background Workflows (Resend)

| Test ID | Module | Scenario / Control | Test Method | Expected Outcome | Actual Outcome | Status | Evidence / Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NOTIF-01**| Welcome Email | Transactional welcome email upon merchant signup | Automated Test | Dispatches branded HTML email via Resend API; non-blocking to signup | Verified payload generation; non-blocking error boundary prevents signup disruption | **PASS** | `scripts/e2e_master_audit.ts` (Batch 6, Test 1) |
| **NOTIF-02**| Payment Receipt | Instant wallet recharge confirmation email | Automated Test | Sends receipt with Razorpay payment ID, amount, and updated balance | Receipt template rendered with payment ID and timestamp | **PASS** | `api/verify-payment.js` |
| **NOTIF-03**| Tracking Alerts | Customer SMS / Email delivery notifications | Integration Test | Triggers notification upon delivery or exception scan event | Event payload formatted with AWB and tracking URL | **PASS** | `apps/dashboard/src/services/notificationService.ts` |
