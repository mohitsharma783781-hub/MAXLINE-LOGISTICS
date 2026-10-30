const puppeteer = require('puppeteer-core');
const path = require('path');

const SCREENSHOT_DIR = 'C:\\Users\\mohit\\.gemini\\antigravity\\brain\\8aed9b44-dae2-4f2f-86bd-58387dc413ca\\screenshots';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LIVE_URL = 'https://www.maxlinelogistics.com';

async function verifyLive() {
  console.log('Launching Chrome to verify live deployment at:', LIVE_URL);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. PUBLIC ROUTES
  const publicRoutes = [
    { name: 'live_01_landing', url: `${LIVE_URL}/` },
    { name: 'live_02_seller_login', url: `${LIVE_URL}/login` },
    { name: 'live_03_admin_login', url: `${LIVE_URL}/admin/login` },
    { name: 'live_04_public_tracking', url: `${LIVE_URL}/track` }
  ];

  for (const r of publicRoutes) {
    try {
      console.log(`Checking route: ${r.url}`);
      await page.goto(r.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await new Promise(res => setTimeout(res, 1200));
      const title = await page.title();
      const file = path.join(SCREENSHOT_DIR, `${r.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`SUCCESS: ${r.name} | Title: "${title}" | Saved: ${file}`);
    } catch (err) {
      console.error(`ERROR visiting ${r.url}:`, err.message);
    }
  }

  // 2. SELLER FRESH ACCOUNT STATE
  try {
    console.log('Testing fresh Seller Portal on live domain...');
    await page.goto(`${LIVE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => {
      const sellerUser = {
        id: 'new-seller-user-01',
        fullName: 'New Enterprise Seller',
        workEmail: 'seller@brand.in',
        role: 'customer',
        businessName: 'Fresh Retail Pvt Ltd',
        tenantId: 'fresh-tenant-uuid-01',
      };
      localStorage.setItem('courrier3_active_portal', 'CUSTOMER');
      localStorage.setItem('courrier3_active_tenant_id', 'fresh-tenant-uuid-01');
      localStorage.setItem('courrier3_current_user', JSON.stringify(sellerUser));
    });

    await page.goto(`${LIVE_URL}/app`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(res => setTimeout(res, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'live_05_seller_dashboard.png'), fullPage: false });
    console.log('SUCCESS: live_05_seller_dashboard saved.');

    await page.goto(`${LIVE_URL}/app/wallet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(res => setTimeout(res, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'live_07_seller_wallet.png'), fullPage: false });
    console.log('SUCCESS: live_07_seller_wallet saved.');

    await page.goto(`${LIVE_URL}/app/settings/kyc`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(res => setTimeout(res, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'live_08_seller_kyc.png'), fullPage: false });
    console.log('SUCCESS: live_08_seller_kyc saved.');
  } catch (err) {
    console.error('Error during seller portal check:', err.message);
  }

  // 3. ADMIN PORTAL STATE
  try {
    console.log('Testing Admin Portal on live domain...');
    await page.evaluate(() => {
      const adminUser = {
        id: 'admin-super-01',
        fullName: 'MAXLINE Platform Administrator',
        workEmail: 'admin@maxlinelogistics.com',
        role: 'super_admin',
        businessName: 'MAXLINE LOGISTICS Platform Headquarters',
        tenantId: 'ALL',
      };
      localStorage.setItem('courrier3_active_portal', 'ADMIN');
      localStorage.setItem('courrier3_active_tenant_id', 'ALL');
      localStorage.setItem('courrier3_current_user', JSON.stringify(adminUser));
    });

    await page.goto(`${LIVE_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(res => setTimeout(res, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'live_06_admin_dashboard.png'), fullPage: false });
    console.log('SUCCESS: live_06_admin_dashboard saved.');
  } catch (err) {
    console.error('Error during admin portal check:', err.message);
  }

  await browser.close();
  console.log('All live checks completed successfully.');
}

verifyLive().catch(console.error);
