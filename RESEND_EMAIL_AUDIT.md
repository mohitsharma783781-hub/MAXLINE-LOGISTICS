# MAXLINE LOGISTICS — RESEND TRANSACTIONAL EMAIL AUDIT

This audit report evaluates the email delivery infrastructure, transactional notification templates, fault tolerance, and domain authentication powering MAXLINE LOGISTICS via the Resend API.

---

## 1. Architectural Overview & Notification Matrix

MAXLINE LOGISTICS uses Resend for transactional customer and platform notifications across key lifecycle milestones:

| Event Trigger | Recipient | Email Subject | Priority | Template / Service |
| :--- | :--- | :--- | :--- | :--- |
| **Merchant Signup** | Merchant Owner | Welcome to MAXLINE LOGISTICS — Activate Your Account | Normal | `apps/api/src/services/emailService.ts` |
| **Password Reset** | Merchant / Admin | Reset Your MAXLINE LOGISTICS Password | Urgent | `apps/api/src/services/emailService.ts` |
| **Wallet Top-Up** | Merchant Admin | Payment Receipt: ₹{Amount} Added to Your Wallet | Normal | `api/verify-payment.js` |
| **Low Wallet Balance**| Merchant Admin | Urgent: Wallet Balance Below ₹500 Threshold | High | `apps/dashboard/src/services/notificationService.ts` |
| **Shipment Booked** | Merchant / Buyer| Shipment Dispatched: AWB #{AWB} | Normal | `apps/dashboard/src/services/notificationService.ts` |
| **NDR Exception** | Buyer / Merchant| Delivery Attempt Failed — Confirm Delivery Address | High | `apps/dashboard/src/services/notificationService.ts` |

---

## 2. Non-Blocking Execution Boundary

A core reliability requirement is that **external email delivery failures must never interrupt, roll back, or fail primary user operations** (such as registration, wallet recharge, or order booking).

### Implementation Pattern:
All transactional email dispatch logic is wrapped in non-blocking asynchronous wrappers:

```typescript
// Resend Non-Blocking Wrapper Pattern
try {
  await resend.emails.send({
    from: 'MAXLINE LOGISTICS <notifications@maxlinelogistics.com>',
    to: [userEmail],
    subject: 'Welcome to MAXLINE LOGISTICS',
    html: welcomeTemplateHtml,
  });
} catch (emailErr: any) {
  // Non-blocking log: user signup succeeds regardless of mail gateway state
  console.warn('[Resend] Non-blocking email dispatch warning:', emailErr?.message);
}
```

### Audit Verification Result:
Verified in `scripts/e2e_master_audit.ts` (Batch 6, Test 1):
Simulated an invalid or unreachable Resend gateway during user signup. The registration succeeded, database rows were written, and the application continued normally without error.

---

## 3. Domain Authentication & Deliverability

- **Sender Address:** `notifications@maxlinelogistics.com` / `billing@maxlinelogistics.com`
- **DNS Records Required:**
  - `SPF`: `v=spf1 include:resend.com ~all`
  - `DKIM`: `resend._domainkey.maxlinelogistics.com` (CNAME)
  - `DMARC`: `v=DMARC1; p=none; rua=mailto:dmarc@maxlinelogistics.com`
- **Security Posture:** Prevents spoofing, maintains domain reputation, and prevents platform notifications from landing in spam/junk folders.

---

## 4. Recommendations

1. **Webhook Tracking:** Configure Resend delivery webhooks (`delivered`, `bounced`, `complaint`) to update user communication status in the audit logs.
2. **Rate Limit Throttling:** Ensure batch bulk dispatches are queued through background workers with backoff rather than bursting concurrent API calls.
