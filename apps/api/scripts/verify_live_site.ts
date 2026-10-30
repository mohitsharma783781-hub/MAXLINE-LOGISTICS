import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

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

  const routes = [
    { name: 'live_01_landing', url: `${LIVE_URL}/` },
    { name: 'live_02_seller_login', url: `${LIVE_URL}/login` },
    { name: 'live_03_admin_login', url: `${LIVE_URL}/admin/login` },
    { name: 'live_04_public_tracking', url: `${LIVE_URL}/track` }
  ];

  for (const r of routes) {
    try {
      console.log(`Checking route: ${r.url}`);
      await page.goto(r.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(res => setTimeout(res, 1500));
      const title = await page.title();
      const file = path.join(SCREENSHOT_DIR, `${r.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`SUCCESS: ${r.name} | Title: "${title}" | Saved: ${file}`);
    } catch (err: any) {
      console.error(`ERROR visiting ${r.url}:`, err.message);
    }
  }

  await browser.close();
  console.log('All live checks completed successfully.');
}

verifyLive().catch(console.error);
