const puppeteer = require('puppeteer-core');
const path = require('path');

const SCREENSHOT_DIR = 'C:\\Users\\mohit\\.gemini\\antigravity\\brain\\8aed9b44-dae2-4f2f-86bd-58387dc413ca\\screenshots';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LIVE_URL = 'https://www.maxlinelogistics.com/login';

async function testSellerLogin() {
  console.log('Testing live login on:', LIVE_URL);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.goto(LIVE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(res => setTimeout(res, 2000));

  console.log('Typing email & password...');
  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    await emailInput.click({ clickCount: 3 });
    await emailInput.type('mohitsharma99229@gmail.com');
  }

  const passwordInput = await page.$('input[type="password"]');
  if (passwordInput) {
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type('Maxline@2026');
  }

  console.log('Clicking Sign In button...');
  const submitButton = await page.$('button[type="submit"]');
  if (submitButton) {
    await submitButton.click();
  }

  console.log('Waiting for dashboard render...');
  await new Promise(res => setTimeout(res, 5000));

  const currentUrl = page.url();
  console.log('Current URL after submit:', currentUrl);

  const screenshotPath = path.join(SCREENSHOT_DIR, 'live_mohit_dashboard_full.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot saved to:', screenshotPath);

  await browser.close();
}

testSellerLogin().catch(console.error);
