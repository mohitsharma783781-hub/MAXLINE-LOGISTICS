const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const appsDashboard = path.join(rootDir, 'apps', 'dashboard');
const dashboardDist = path.join(appsDashboard, 'dist');
const finalDist = path.join(rootDir, 'dist');

console.log('=== STEP 1: Building apps/dashboard Vite React App ===');
if (!fs.existsSync(path.join(appsDashboard, 'node_modules', 'vite')) && !fs.existsSync(path.join(rootDir, 'node_modules', 'vite'))) {
  console.log('Installing apps/dashboard dependencies with devDependencies...');
  execSync('npm install --include=dev', {
    cwd: appsDashboard,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
}
execSync('npm run build', { cwd: appsDashboard, stdio: 'inherit' });

console.log('=== STEP 2: Assembling Unified Production Build in dist/ ===');
if (fs.existsSync(finalDist)) {
  fs.rmSync(finalDist, { recursive: true, force: true });
}
fs.mkdirSync(finalDist, { recursive: true });

// Copy compiled dashboard dist
fs.cpSync(dashboardDist, finalDist, { recursive: true });

// Rename finalDist/index.html to finalDist/app.html (React SPA container)
const distIndex = path.join(finalDist, 'index.html');
const distApp = path.join(finalDist, 'app.html');
if (fs.existsSync(distIndex)) {
  fs.renameSync(distIndex, distApp);
}

// Prepare root index.html (New Landing Page)
let landingHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
// Route Login and Register CTAs directly to the React Seller Portal
landingHtml = landingHtml.replace(/href="login\.html"/g, 'href="/login"');
landingHtml = landingHtml.replace(/href="register\.html"/g, 'href="/signup"');

fs.writeFileSync(path.join(finalDist, 'index.html'), landingHtml, 'utf8');
console.log('✓ Main landing page installed at dist/index.html');

// Copy policy pages & HTML files
const htmlFiles = [
  'privacy-policy.html',
  'terms-conditions.html',
  'refund-policy.html',
  'shipping-policy.html',
  'contact-us.html',
  'login.html',
  'register.html'
];

for (const file of htmlFiles) {
  const src = path.join(rootDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(finalDist, file));
  }
}
console.log('✓ Static policy and legal pages copied to dist/');

// Copy root images & branding assets
const rootFiles = fs.readdirSync(rootDir);
for (const f of rootFiles) {
  if (/\.(webp|png|jpg|jpeg|svg|ico)$/i.test(f)) {
    const dest = path.join(finalDist, f);
    fs.copyFileSync(path.join(rootDir, f), dest);
  }
}
console.log('✓ Root branding and WebP assets copied to dist/');
console.log('=== BUILD COMPLETE: Unified dist/ ready for deployment! ===');
