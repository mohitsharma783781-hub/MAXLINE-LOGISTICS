# MAXLINE LOGISTICS — FIXES IMPLEMENTED & ARCHITECTURAL STABILIZATION

This report details the concrete, code-level enhancements and fixes deployed across the MAXLINE LOGISTICS platform during the master system stabilization sprint, including the critical Razorpay wallet atomicity fix.

---

## 1. Summary of Modified Components

| Subsystem | File Path | Nature of Fix |
| :--- | :--- | :--- |
| **Serverless API** | `api/verify-payment.js` | Converted multi-step REST calls into a single atomic PostgreSQL RPC call (`credit_wallet_rpc`) with row-level locking (`FOR UPDATE`) and server-side amount verification from Razorpay API. |
| **Serverless Webhook** | `api/razorpay-webhook.js` | Created dedicated webhook endpoint verifying HMAC signatures and calling the exact same atomic RPC with matching idempotency key. |
| **Backend API** | `apps/api/src/controllers/payment.controller.ts` | Upgraded `verifyPayment` and added `razorpayWebhook` calling `public.credit_wallet_rpc` with PostgreSQL row locking. |
| **Backend Routes** | `apps/api/src/routes/payment.routes.ts` | Registered `/webhook` alongside `/create-order` and `/verify-payment`. |
| **Database Stored Procedure** | PostgreSQL `credit_wallet_rpc` | Updated function to acquire row-level lock (`FOR UPDATE`), auto-provision uninitialized wallets, enforce idempotency under lock, and mutate balance and ledger in a single transaction. |
| **Database Service** | `apps/dashboard/src/services/supabase/supabaseWalletService.ts` | Aligned transaction type enum to `FREIGHT_DEBIT`, implemented direct PostgreSQL fallbacks for RPC failures. |
| **Admin Onboarding** | `apps/dashboard/src/pages/admin/AdminOnboardingTrackerPage.tsx` | Fixed missing `useEffect` import, wired live Supabase merchant synchronization, and eliminated crash on page load. |
| **Admin KYC** | `apps/dashboard/src/pages/admin/AdminKycVerificationPage.tsx` | Fixed UUID replacement bug, enabled direct Supabase KYC document verification updates and merchant status toggling. |
| **Onboarding Service**| `apps/dashboard/src/services/onboardingService.ts` | Filtered legacy demo merchants from localStorage, implemented automated cloud merchant sync and status progression. |
| **Seller Wallet UI** | `apps/dashboard/src/pages/app/WalletPage.tsx` | Integrated `syncFromSupabase` on component mount and payment success to ensure immediate cloud balance visibility. |
| **Application Root** | `apps/dashboard/src/main.tsx` | Added client-side cache sanitization to purge obsolete demo state on first load; fixed syntax errors. |

---

## 2. Technical Code Modifications & In-Depth Analysis

### Fix 1: Single Authoritative Server-Side Atomic Credit (`credit_wallet_rpc` & `api/verify-payment.js`)

**Problem:**
Previously, `api/verify-payment.js` performed wallet balance updates and ledger insertions through multiple separate PostgREST requests:
1. REST GET on `wallet_transactions`
2. REST GET on `wallets`
3. REST PATCH on `wallets`
4. REST POST on `wallet_transactions`

If a client callback and an asynchronous Razorpay webhook arrived at the same time, both could read the same initial balance before either had committed the PATCH, creating a race condition that could lead to duplicate credits or ledger discrepancies.

**Solution:**
Replaced the separate REST calls with a single call to `public.credit_wallet_rpc`:

```javascript
// Single Authoritative Server-Side Atomic Credit via PostgreSQL RPC
const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/credit_wallet_rpc`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    p_merchant_id: verifiedMerchantId,
    p_amount_minor: verifiedAmountMinor,
    p_reference_type: 'RAZORPAY',
    p_reference_id: razorpay_payment_id,
    p_idempotency_key: idempotencyKey,
    p_description: `Wallet Balance Added via Razorpay (${razorpay_payment_id})`,
  }),
});
```

Inside PostgreSQL, `credit_wallet_rpc` executes as a single transaction with:
1. `SELECT * FROM public.wallets WHERE merchant_id = p_merchant_id FOR UPDATE` (Row-level lock serializing concurrent requests).
2. Auto-provisions wallet if missing.
3. Checks `idempotency_key = p_idempotency_key` under the lock (Duplicate hits immediately return `is_duplicate: true` with zero balance mutation).
4. Atomically mutates `wallets.available_balance_minor` and `wallets.total_recharged_minor`.
5. Inserts an immutable row into `public.wallet_transactions`.

---

### Fix 2: Server-Side Anti-Tampering (Razorpay API Verification)

**Problem:**
A malicious client could attempt to send `amountINR: 99999` or an altered `merchantId` in the JSON body of `/api/verify-payment`.

**Solution:**
Before crediting, the server calls `https://api.razorpay.com/v1/orders/:order_id` with HTTP Basic auth:
- Derives the true credit amount strictly from `orderData.amount` (in paise).
- Resolves the merchant ID strictly from `orderData.notes.merchantId`.
- Completely neutralizes client-supplied payload tampering.

---

### Fix 3: Unified Idempotency Across Webhook & Callback

Both client callback (`/api/verify-payment`) and webhook (`/api/razorpay-webhook`) use the exact same payment identity:
$$\text{idempotency\_key} = \text{"rzp\_"} \mathbin{\Vert} \text{razorpay\_payment\_id}$$

Verified in `scripts/test_razorpay_atomicity_suite.ts`:
- Simultaneous arrival of callback and webhook: Exactly 1 credits, 1 acknowledged as duplicate.
- 20 concurrent requests for same payment ID: Exactly 1 credits, 19 acknowledged as duplicate.
- Final wallet balance incremented by exactly 1x amount.
- Mathematical ledger reconciliation invariant holds with ₹0.00 discrepancy.
