# MAXLINE LOGISTICS — FULL FEATURE INVENTORY

This document provides an exhaustive, automated inventory of every functional module, route, user role, API endpoint, database dependency, and component in the MAXLINE LOGISTICS multi-tenant SaaS.

---

## 1. Executive System Topology

- **Architecture:** Monorepo consisting of:
  - Frontend SPA: React 18 + TypeScript + Vite + Tailwind/Custom Design System (`apps/dashboard`)
  - Backend API: Express.js + Prisma ORM + PostgreSQL / Supabase Tokyo Pooler (`apps/api`)
  - Serverless Functions: Vercel Edge Serverless Functions (`api/`)
  - Database: Supabase PostgreSQL (multi-schema `public` & `auth`)
  - External Gateways: Razorpay Payments, Delhivery B2C Courier API, Resend Transactional Email

---

## 2. Public & Authentication Modules

| Feature Name | Panel | Route | Component | User Role | API Endpoint | Database Dependency | Expected Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Landing Page** | Public | `/` | `LandingPage.tsx` | All / Anonymous | Static Asset | None | High-converting marketing page with 3D logistics hero, pincode coverage, and direct signup CTAs |
| **Public Tracking** | Public | `/track`, `/track/:awb` | `PublicTrackingPage.tsx` | All / Anonymous | `api/delhivery/track.js` | `shipments`, `shipment_tracking_events` | Instant live multi-carrier tracking timeline with scan events |
| **Seller Registration** | Auth | `/register`, `/signup` | `SignupPage.tsx` | Anonymous | `/api/v1/auth/register` | `merchants`, `users`, `merchant_members`, `wallets` | Registers merchant, creates user with bcrypt hash, maps OWNER role, provisions ₹0.00 wallet |
| **Seller Login** | Auth | `/login`, `/auth/login` | `LoginPage.tsx` | Registered Merchant | `/api/v1/auth/login` | `users`, `auth.users`, `merchant_members` | Verifies credentials, issues signed JWT token, redirects to `/app` |
| **Admin Login** | Admin Auth | `/admin/login` | `AdminLoginPage.tsx` | Platform Admin | `/api/v1/auth/login` | `users`, `auth.users` | Dedicated secure Super Admin login with platform role gating |
| **Password Reset** | Auth | `/forgot-password`, `/reset-password` | `ForgotPasswordPage.tsx` | Merchant / Admin | `/api/v1/auth/reset-password` | `users`, `auth.users` | Generates secure password reset token, sends recovery email |

---

## 3. Merchant / Seller Portal Modules (`/app`)

| Feature Name | Panel | Route | Component | User Role | API Endpoint | Database Dependency | Expected Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Merchant Dashboard** | Seller | `/app` | `CustomerDashboard.tsx` | Merchant Admin / Staff | `/rest/v1/wallets`, `/rest/v1/shipments` | `wallets`, `shipments` | Live KPI cards (Orders, Transit, Delivered, Wallet Balance), quick actions, and recent activity |
| **Onboarding Wizard** | Seller | `/app/onboarding` | `SellerOnboardingWizardPage.tsx` | Merchant (New) | `/rest/v1/merchants`, `/rest/v1/warehouses` | `merchants`, `warehouses` | 5-step interactive onboarding (Company profile, address, KYC docs, bank details, warehouse creation) |
| **Create Shipment (B2C)** | Seller | `/app/orders/create` | `CreateShipmentWizardPage.tsx` | Merchant Admin | `/api/delhivery/create-shipment.js` | `shipments`, `wallets`, `wallet_transactions` | Pincode validation, volumetric calculation, courier selection, atomic wallet debit, live AWB generation |
| **Create Shipment (B2B)** | Seller | `/app/orders/create` | `CreateShipmentWizardPage.tsx` | Merchant Admin | `/api/v1/b2b-rates/calculate-quote` | `b2b_rate_cards`, `wallets` | Multi-package commercial freight booking, commercial invoice validation, slab rating |
| **All Orders** | Seller | `/app/orders` | `CustomerOrdersPage.tsx` | Merchant Admin / Staff | `/rest/v1/shipments` | `shipments` | Filterable, searchable data table of all merchant dispatches with live status tags |
| **Bulk Order Upload** | Seller | `/app/bulk/upload` | `BulkOrderImportPage.tsx` | Merchant Admin | `/rest/v1/shipments` | `shipments` | Multi-sheet Excel parser, field validation, batch order creation |
| **Pickups & Manifests** | Seller | `/app/pickups` | `PickupsPage.tsx` | Merchant Admin | `/api/delhivery/pickup.js` | `pickup_requests`, `manifests` | Doorstep courier pickup scheduling and generation of official carrier run sheets |
| **Manifest Generator** | Seller | `/app/manifests/create` | `CreateManifestPage.tsx` | Merchant Admin | `/rest/v1/manifests` | `manifests`, `manifest_items` | Consolidates booked parcels into printable carrier handover sheets with master barcode |
| **Live Tracking** | Seller | `/app/tracking` | `TrackingPage.tsx` | Merchant Admin / Staff | `/api/delhivery/track.js` | `shipment_tracking_events` | Granular scan event logs, estimated delivery dates, and courier exception tracking |
| **NDR Exceptions** | Seller | `/app/ndr` | `NdrManagementPage.tsx` | Merchant Admin | `/rest/v1/ndr_records` | `ndr_records` | Actionable non-delivery reports with re-attempt scheduling and customer verification |
| **RTO Returns** | Seller | `/app/rto` | `RtoManagementPage.tsx` | Merchant Admin | `/rest/v1/rto_records` | `rto_records` | Real-time monitoring of return-to-origin shipments with reverse tracking scans |
| **Weight Disputes** | Seller | `/app/weight-discrepancies` | `WeightDiscrepancyPage.tsx` | Merchant Admin | `/rest/v1/weight_discrepancies` | `weight_discrepancies` | Carrier weight audit reconciler with photo proof upload and dispute resolution |
| **Wallet & Top-up** | Seller | `/app/wallet` | `WalletPage.tsx` | Merchant Admin | `/api/create-order`, `/api/verify-payment` | `wallets`, `wallet_transactions` | Razorpay standard checkout top-up, ledger audit trail, low-balance threshold alert |
| **Wallet Recharge Wizard**| Seller | `/app/wallet/recharge` | `WalletRechargeWizardPage.tsx`| Merchant Admin | `/api/create-order`, `/api/verify-payment` | `wallets`, `wallet_transactions` | Dedicated full-screen guided top-up wizard with preset denomination pills |
| **COD Remittances** | Seller | `/app/cod` | `CodDashboardPage.tsx` | Merchant Admin | `/rest/v1/cod_remittances` | `cod_remittances` | Cash-on-delivery collection lifecycle, scheduled bank remittance dates, and reconciliation |
| **GST Invoices** | Seller | `/app/billing` | `CustomerGstInvoicesPage.tsx`| Merchant Admin | `/rest/v1/invoices` | `invoices` | Monthly freight tax invoices with B2B GST input credit breakdowns and PDF downloads |
| **Rate Calculator** | Seller | `/app/rates` | `RateCalculatorPage.tsx` | Merchant Admin / Staff | Local rate engine | `merchant_rate_assignments` | Live freight quote estimator comparing surface and air carriers across all zones |
| **My Rate Card** | Seller | `/app/my-rate-card` | `CustomerMyRateCardPage.tsx` | Merchant Admin | `/rest/v1/rate_assignments` | `merchant_rate_assignments` | Transparent view of assigned B2C and B2B pricing matrices, fuel surcharges, and COD rates |
| **Pincode Checker** | Seller | `/app/serviceability` | `ServiceabilityPage.tsx` | Merchant Admin / Staff | `/api/delhivery/serviceability.js`| None (External API) | Checks delivery serviceability, COD availability, and turnaround times for 29,000+ pincodes |
| **Warehouses** | Seller | `/app/warehouses` | `WarehousesPage.tsx` | Merchant Admin | `/rest/v1/warehouses` | `warehouses` | Multi-location warehouse registration, default dispatch hub selection, and contact management |
| **Company Profile** | Seller | `/app/settings/company` | `CompanyProfilePage.tsx` | Merchant Admin | `/rest/v1/merchants` | `merchants` | Business name, brand logo, support contact details, and registered entity configuration |
| **KYC & Bank Details** | Seller | `/app/settings/kyc` | `SellerKycVerificationPage.tsx` | Merchant Admin | `/rest/v1/merchant_kyc_documents` | `merchant_kyc_documents` | Uploads PAN, GST, Cheque proof to Supabase Storage; monitors verification state |

---

## 4. Super Admin Portal Modules (`/admin`)

| Feature Name | Panel | Route | Component | User Role | API Endpoint | Database Dependency | Expected Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin Dashboard** | Admin | `/admin` | `AdminDashboardPage.tsx` | Platform Admin | Direct PostgreSQL queries | `merchants`, `shipments`, `wallets` | Platform-wide macro KPIs: Total sellers, active volume, pending KYC gates, platform wallet balance |
| **Customer Management** | Admin | `/admin/customers` | `AdminCustomersPage.tsx` | Platform Admin | `AdminManagementService.getMerchants`| `merchants`, `users`, `merchant_members` | Comprehensive merchant registry with KYC status, rate card assignments, status toggling, and 1-click login |
| **Customer 360 Detail** | Admin | `/admin/customers/:id` | `AdminCustomerDetailPage.tsx` | Platform Admin | Direct PostgreSQL queries | `merchants`, `users`, `wallets`, `shipments` | Deep profile view: KYC audits, wallet adjustments, rate card assignment, account controls |
| **Onboarding Tracker** | Admin | `/admin/onboarding` | `AdminOnboardingTrackerPage.tsx`| Platform Admin | `OnboardingService.syncWithMerchants` | `merchants`, `merchant_members` | Kanban-style progress tracker monitoring stage progression from signup to initial dispatch |
| **KYC Verification Desk**| Admin | `/admin/kyc` | `AdminKycVerificationPage.tsx`| Platform Admin / Compliance | `/rest/v1/merchant_kyc_documents` | `merchant_kyc_documents` | Compliance portal to inspect uploaded government documents and execute Approve/Reject decisions |
| **Customer Wallets** | Admin | `/admin/customer-wallets` | `AdminCustomerWalletsPage.tsx` | Platform Admin / Finance | `AdminManagementService.getWallets` | `wallets`, `wallet_transactions` | Master financial ledger displaying all merchant balances with manual credit/debit adjustment tools |
| **Platform Shipments** | Admin | `/admin/shipments` | `AdminShipmentsPage.tsx` | Platform Admin / Operations | `/rest/v1/shipments` | `shipments` | Global order book across all tenants with courier allocation, AWB tracking, and cancel controls |
| **Selling Rates (B2C)**| Admin | `/admin/selling-rates` | `AdminSellingRatesPage.tsx` | Platform Admin / Commercial | Local rate engine | `rate_cards` | Configures public and tiered B2C shipping rates, fuel surcharges, and COD terms |
| **B2B Rate Cards** | Admin | `/admin/b2b-rates` | `AdminB2BRateCardsPage.tsx` | Platform Admin / Commercial | `/api/v1/b2b-rates` | `b2b_rate_cards`, `b2b_rate_slabs` | Multi-carrier commercial freight pricing matrices, volumetric divisors, and multi-sheet Excel imports |
| **Courier Master** | Admin | `/admin/courier-master` | `AdminCourierMasterPage.tsx` | Platform Admin / Operations | `/rest/v1/couriers` | `couriers` | Global courier partner management (Delhivery, BlueDart, DTDC, Xpressbees) and API credentials |
| **Zones & Pincodes** | Admin | `/admin/zones` | `AdminZonesPage.tsx` | Platform Admin / Operations | `/rest/v1/zones` | `zones`, `pincode_zones` | Geographic freight zone definitions (Within City, Within State, Regional, Metro, Rest of India) |
| **Pincode Import** | Admin | `/admin/pincodes/import` | `AdminPinImportPage.tsx` | Platform Admin / Operations | Bulk upload endpoint | `pincodes` | Bulk CSV/Excel importer for national pincode directory and courier serviceability mapping |
| **Roles & Permissions**| Admin | `/admin/roles` | `AdminRolesPage.tsx` | Super Admin | `/api/v1/admin/roles` | `roles`, `permissions` | RBAC matrix defining granular access rights for Super Admin, Admin Operator, and Support staff |
| **User Access Logs** | Admin | `/admin/access-logs` | `AdminAccessLogsPage.tsx` | Super Admin / Security | `/rest/v1/audit_logs` | `audit_logs` | Tamper-evident audit trail capturing login events, IP addresses, impersonation sessions, and adjustments |
| **COD Remittances** | Admin | `/admin/cod` | `AdminCodRemittancesPage.tsx` | Platform Admin / Finance | `/rest/v1/cod_remittances` | `cod_remittances` | Macro COD reconciliation engine for carrier remittance verification and seller payout transfers |
| **GST Tax Invoices** | Admin | `/admin/billing` | `AdminGstInvoicesPage.tsx` | Platform Admin / Finance | `/rest/v1/invoices` | `invoices` | Platform billing engine generating monthly B2B GST tax invoices with HSN/SAC code breakdowns |
