# MAXLINE LOGISTICS — DEPLOYMENT READINESS & OPERATIONS MANUAL

This document verifies the production deployment architecture, Vercel edge configuration, environment variable specifications, build artifacts, and rollback protocols for MAXLINE LOGISTICS (`maxlinelogistics.com`).

---

## 1. Hosting Topology & Vercel Configuration

The production architecture deploys as a hybrid single-page application and static marketing asset via Vercel Edge:

- **Domain:** `https://maxlinelogistics.com`
- **Output Directory:** `dist`
- **Build Command:** `node scripts/build.js`
- **Install Command:** `npm install && cd apps/dashboard && npm install --include=dev`

### Routing & Rewrite Invariant:
To ensure the live marketing landing page remains pristine while enabling full React SPA functionality on `/app/*` and `/admin/*`, `vercel.json` and `scripts/build.js` configure the following routes:

| Request Path | Served File | Caching Policy | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | `dist/index.html` | `must-revalidate, max-age=0` | Live high-converting marketing landing page |
| `/terms`, `/privacy`, `/refund` | `dist/*.html` | `public, max-age=3600` | Static policy and legal compliance pages |
| `/app`, `/app/*` | `dist/app.html` | `must-revalidate, max-age=0` | Seller / Merchant Dashboard SPA |
| `/admin`, `/admin/*` | `dist/app.html` | `must-revalidate, max-age=0` | Super Admin Platform Management SPA |
| `/login`, `/register`, `/auth/*` | `dist/app.html` | `must-revalidate, max-age=0` | Authentication & Onboarding SPA |
| `/api/*` | Vercel Serverless | No-cache | Edge serverless functions (Razorpay & Delhivery) |
| `/assets/*` | Vite Chunks | `immutable, max-age=31536000` | Hashed CSS, JS, and image bundles |

---

## 2. Production Environment Variables Checklist

The following environment variables must be configured in Vercel Project Settings:

| Variable Name | Required Scope | Purpose | Status |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Server / Edge | PostgreSQL connection string to Supabase Tokyo pooler | Configured |
| `SUPABASE_URL` | Edge Functions | Supabase REST / PostgREST base endpoint | Configured |
| `SUPABASE_SERVICE_ROLE_KEY` | Server / Edge | Privileged key for server-side wallet & merchant operations | Configured |
| `VITE_SUPABASE_URL` | Frontend Client | Public Supabase project URL | Configured |
| `VITE_SUPABASE_ANON_KEY` | Frontend Client | Client-side publishable key with RLS enforcement | Configured |
| `RAZORPAY_KEY_ID` | Client & Edge | Razorpay public key for checkout launch | Configured |
| `RAZORPAY_KEY_SECRET` | Edge Serverless | Secret key for HMAC-SHA256 signature verification | Configured |
| `DELHIVERY_API_KEY` | Edge Serverless | Delhivery B2C production/sandbox gateway API token | Configured |
| `DELHIVERY_CLIENT_ID` | Edge Serverless | Registered Delhivery enterprise account identifier | Configured |
| `RESEND_API_KEY` | Edge / API | Resend API key for transactional email dispatches | Configured |
| `JWT_SECRET` | Backend API | Secret key for signing platform JSON Web Tokens | Configured |

> [!IMPORTANT]
> Never commit real secret keys into the Git repository. Production values are managed exclusively through Vercel and local `.env` files protected by `.gitignore`.

---

## 3. Build Pipeline Verification

The unified build pipeline was executed and validated:
- **Command:** `node scripts/build.js`
- **Output:**
  ```text
  === STEP 1: Building apps/dashboard Vite React App ===
  vite v8.2.1 building client environment for production...
  ✓ 2096 modules transformed.
  ✓ built in 10.57s
  === STEP 2: Assembling Unified Production Build in dist/ ===
  ✓ Main landing page installed at dist/index.html
  ✓ Static policy and legal pages copied to dist/
  ✓ Root branding and WebP assets copied to dist/
  === BUILD COMPLETE: Unified dist/ ready for deployment! ===
  ```
- **Zero Asset Regressions:** Verified that `dist/index.html` preserves the landing page hero and branding, while `dist/app.html` hosts the React SPA.

---

## 4. Rollback & Disaster Recovery Strategy

In the event of an unexpected regression upon deployment:
1. **Instant Vercel Rollback:** Navigate to Vercel Deployments, locate the previous stable deployment (Commit `1462a68`), and click "Promote to Production". Reversion occurs in under 5 seconds with zero server restart.
2. **Database Point-in-Time Recovery:** If database rows require restoration, Supabase provides PITR to restore to any minute within the preceding 7 days.
3. **Local Git Checkpoint:** Baseline state is tagged at `baseline-audit-start`.
