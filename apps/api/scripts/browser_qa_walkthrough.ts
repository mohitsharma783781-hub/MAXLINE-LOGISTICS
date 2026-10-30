import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\mohit\\.gemini\\antigravity\\brain\\8aed9b44-dae2-4f2f-86bd-58387dc413ca\\screenshots';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5174';

interface QAResult {
  page: string;
  url: string;
  status: 'PASS' | 'FAIL';
  loadTimeMs: number;
  screenshot?: string;
  notes?: string;
  errors: string[];
}

const qaResults: QAResult[] = [];

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runQA() {
  console.log('=== MAXLINE LOGISTICS BROWSER QA AUTOMATION STARTING ===\n');

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const pageErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      pageErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  // Helper to record visit
  async function testRoute(name: string, route: string, screenshotName: string, setupAuth?: (p: any) => Promise<void>) {
    pageErrors.length = 0;
    const start = Date.now();
    const fullUrl = `${BASE_URL}${route}`;
    console.log(`Testing [${name}] -> ${fullUrl}`);

    try {
      if (setupAuth) {
        await setupAuth(page);
      }

      await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      await delay(800); // allow lazy component render

      const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      const loadTimeMs = Date.now() - start;
      const criticalErrors = pageErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource: net::ERR_CONNECTION_REFUSED'));

      const pass = criticalErrors.length === 0;
      qaResults.push({
        page: name,
        url: route,
        status: pass ? 'PASS' : 'FAIL',
        loadTimeMs,
        screenshot: screenshotName,
        notes: `Rendered in ${loadTimeMs}ms`,
        errors: criticalErrors,
      });

      console.log(`  ✓ ${pass ? 'PASS' : 'FAIL'}: ${name} (${loadTimeMs}ms) -> ${screenshotName}`);
    } catch (err: any) {
      qaResults.push({
        page: name,
        url: route,
        status: 'FAIL',
        loadTimeMs: Date.now() - start,
        errors: [err.message],
      });
      console.error(`  ✗ FAIL: ${name} - ${err.message}`);
    }
  }

  // 1. PUBLIC ROUTES
  console.log('\n--- SUITE 1: PUBLIC PAGES ---');
  await testRoute('Landing Page', '/', '01_landing_desktop.png');
  await testRoute('Seller Login Page', '/login', '02_seller_login.png');
  await testRoute('Admin Login Page', '/admin/login', '03_admin_login.png');
  await testRoute('Public Tracking Page', '/tracking', '04_public_tracking.png');

  // 2. ADMIN AUTH & WALKTHROUGH
  console.log('\n--- SUITE 2: ADMIN PANEL WALKTHROUGH ---');
  const setAdminAuth = async (p: any) => {
    await p.evaluate(() => {
      const adminUser = {
        id: 'admin-super-01',
        fullName: 'MAXLINE Platform Administrator',
        workEmail: 'admin@maxline.in',
        role: 'super_admin',
        businessName: 'MAXLINE LOGISTICS Platform',
        tenantId: 'ALL',
      };
      localStorage.setItem('courrier3_active_portal', 'ADMIN');
      localStorage.setItem('courrier3_active_tenant_id', 'ALL');
      localStorage.setItem('courrier3_current_user', JSON.stringify(adminUser));
    });
  };

  await testRoute('Admin Dashboard', '/admin', '05_admin_dashboard.png', setAdminAuth);
  await testRoute('Admin Customers & Merchants', '/admin/customers', '06_admin_merchants.png', setAdminAuth);
  await testRoute('Admin Customer Wallets', '/admin/customer-wallets', '07_admin_customer_wallets.png', setAdminAuth);
  await testRoute('Admin B2B Rate Cards Master', '/admin/b2b-rates', '08_admin_b2b_rates.png', setAdminAuth);
  await testRoute('Admin Courier Master', '/admin/couriers', '09_admin_couriers.png', setAdminAuth);
  await testRoute('Admin All Shipments', '/admin/shipments', '10_admin_shipments.png', setAdminAuth);
  await testRoute('Admin Roles & Access', '/admin/roles', '11_admin_roles.png', setAdminAuth);
  await testRoute('Admin Onboarding Tracker', '/admin/onboarding', '12_admin_onboarding.png', setAdminAuth);

  // 3. SELLER AUTH & WALKTHROUGH
  console.log('\n--- SUITE 3: SELLER PANEL WALKTHROUGH ---');
  const setSellerAuth = async (p: any) => {
    await p.evaluate(() => {
      const sellerUser = {
        id: 'seller-mohit-01',
        fullName: 'Mohit Sharma',
        workEmail: 'mohitsharma99229@gmail.com',
        role: 'customer',
        businessName: 'XYZ LOGISTICS',
        tenantId: '48dba919-ca2a-4a86-b645-f795f70e9d59',
      };
      localStorage.setItem('courrier3_active_portal', 'CUSTOMER');
      localStorage.setItem('courrier3_active_tenant_id', '48dba919-ca2a-4a86-b645-f795f70e9d59');
      localStorage.setItem('courrier3_current_user', JSON.stringify(sellerUser));
    });
  };

  await testRoute('Seller Dashboard', '/app', '13_seller_dashboard.png', setSellerAuth);
  await testRoute('Create Shipment Wizard (Step 1)', '/app/shipments/create', '14_seller_create_shipment.png', setSellerAuth);
  await testRoute('Seller Orders List', '/app/orders', '15_seller_orders.png', setSellerAuth);
  await testRoute('Seller Live Tracking', '/app/tracking', '16_seller_tracking.png', setSellerAuth);
  await testRoute('Seller Wallet & Ledger', '/app/wallet', '17_seller_wallet.png', setSellerAuth);
  await testRoute('Seller Pickup Warehouses', '/app/warehouses', '18_seller_warehouses.png', setSellerAuth);
  await testRoute('Seller Rate Calculator', '/app/rates', '19_seller_rate_calculator.png', setSellerAuth);
  await testRoute('Seller Billing Settings', '/app/settings/billing', '20_seller_billing.png', setSellerAuth);
  await testRoute('Seller KYC Verification Center', '/app/settings/kyc', '24_seller_kyc_center.png', setSellerAuth);

  // 4. SUPER ADMIN PREVIEW OF SELLER PORTAL
  console.log('\n--- SUITE 4: SUPER ADMIN PREVIEW MODE ---');
  await testRoute('Super Admin Preview of Seller Portal', '/app', '23_super_admin_preview_seller.png', setAdminAuth);

  // 5. MOBILE RESPONSIVENESS
  console.log('\n--- SUITE 5: MOBILE RESPONSIVENESS (375x812) ---');
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await testRoute('Seller Dashboard Mobile', '/app', '21_seller_dashboard_mobile.png', setSellerAuth);
  await testRoute('Admin Dashboard Mobile', '/admin', '22_admin_dashboard_mobile.png', setAdminAuth);

  await browser.close();

  console.log('\n=== QA RESULTS SUMMARY ===');
  console.log(`Total Pages Tested: ${qaResults.length}`);
  const passed = qaResults.filter((r) => r.status === 'PASS').length;
  const failed = qaResults.filter((r) => r.status === 'FAIL').length;
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);

  const reportPath = path.join(SCREENSHOT_DIR, 'qa_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(qaResults, null, 2), 'utf-8');
  console.log(`\nDetailed report written to: ${reportPath}`);
}

runQA().catch((e) => {
  console.error('QA Automation Fatal Error:', e);
  process.exit(1);
});
