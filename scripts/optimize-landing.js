const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Head preloads and preconnects
if (!html.includes('maxline_logo.webp')) {
  html = html.replace(
    '<link rel="icon" type="image/png" href="maxline_icon.png">',
    '<link rel="icon" type="image/png" href="maxline_icon.png">\n    <link rel="dns-prefetch" href="https://cdn.tailwindcss.com">\n    <link rel="preconnect" href="https://cdn.tailwindcss.com" crossorigin>\n    <link rel="preload" as="image" href="maxline_logo.webp" type="image/webp">\n    <link rel="preload" as="image" href="maxline_truck_transparent.webp" type="image/webp">'
  );
}

// 2. Header logo
html = html.replace(
  '<img src="maxline_logo.png" alt="MAXLINE LOGISTICS" class="h-10 sm:h-11 md:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]">',
  '<img src="maxline_logo.webp" alt="MAXLINE LOGISTICS" fetchpriority="high" decoding="async" class="h-10 sm:h-11 md:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]">'
);

// 3. Hero Truck
html = html.replace(
  '<img src="maxline_truck_transparent.png" alt="MAXLINE LOGISTICS Express Truck" class="h-24 sm:h-32 md:h-36 w-auto object-contain filter drop-shadow-2xl">',
  '<img src="maxline_truck_transparent.webp" alt="MAXLINE LOGISTICS Express Truck" fetchpriority="high" decoding="async" class="h-24 sm:h-32 md:h-36 w-auto object-contain filter drop-shadow-2xl">'
);

// 4. Partner logos (Marquee)
html = html.replace(
  '<img src="dpworld.png" alt="DP WORLD" class="h-9 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform">',
  '<img src="dpworld.webp" alt="DP WORLD" loading="lazy" decoding="async" class="h-9 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform">'
);
html = html.replace(
  '<img src="delhivery.png" alt="DELHIVERY" class="h-8 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform">',
  '<img src="delhivery.webp" alt="DELHIVERY" loading="lazy" decoding="async" class="h-8 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform">'
);
html = html.replace(
  '<img src="xpressbees.png" alt="XPRESSBEES" class="h-8 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform">',
  '<img src="xpressbees.webp" alt="XPRESSBEES" loading="lazy" decoding="async" class="h-8 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform">'
);
html = html.replace(
  '<img src="dtdc.png" alt="DTDC" class="h-9 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform">',
  '<img src="dtdc.webp" alt="DTDC" loading="lazy" decoding="async" class="h-9 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform">'
);
html = html.replace(
  '<img src="bluedart.png" alt="BLUE DART" class="h-9 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform">',
  '<img src="bluedart.webp" alt="BLUE DART" loading="lazy" decoding="async" class="h-9 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform">'
);

// Marquee duplicates
html = html.replace(
  '<img src="dpworld.png" alt="DP WORLD" class="h-9 w-auto object-contain mix-blend-multiply">',
  '<img src="dpworld.webp" alt="DP WORLD" loading="lazy" decoding="async" class="h-9 w-auto object-contain mix-blend-multiply">'
);
html = html.replace(
  '<img src="delhivery.png" alt="DELHIVERY" class="h-8 w-auto object-contain mix-blend-multiply">',
  '<img src="delhivery.webp" alt="DELHIVERY" loading="lazy" decoding="async" class="h-8 w-auto object-contain mix-blend-multiply">'
);
html = html.replace(
  '<img src="xpressbees.png" alt="XPRESSBEES" class="h-8 w-auto object-contain mix-blend-multiply">',
  '<img src="xpressbees.webp" alt="XPRESSBEES" loading="lazy" decoding="async" class="h-8 w-auto object-contain mix-blend-multiply">'
);
html = html.replace(
  '<img src="dtdc.png" alt="DTDC" class="h-9 w-auto object-contain mix-blend-multiply">',
  '<img src="dtdc.webp" alt="DTDC" loading="lazy" decoding="async" class="h-9 w-auto object-contain mix-blend-multiply">'
);
html = html.replace(
  '<img src="bluedart.png" alt="BLUE DART" class="h-9 w-auto object-contain mix-blend-multiply">',
  '<img src="bluedart.webp" alt="BLUE DART" loading="lazy" decoding="async" class="h-9 w-auto object-contain mix-blend-multiply">'
);

// 5. Delivery Boy (Large Hero image)
html = html.replace(
  '<img src="maxline_delivery_transparent.png" alt="MAXLINE LOGISTICS Express Delivery Partner" class="w-full max-h-[580px] md:max-h-[620px] object-contain filter drop-shadow-2xl transition-transform duration-300 hover:scale-[1.01]">',
  '<img src="maxline_delivery_transparent.webp" alt="MAXLINE LOGISTICS Express Delivery Partner" loading="lazy" decoding="async" class="w-full max-h-[580px] md:max-h-[620px] object-contain filter drop-shadow-2xl transition-transform duration-300 hover:scale-[1.01]">'
);

// 6. 6 Service Cards
html = html.replace(
  '<img src="service_express_3d.jpg" alt="Express Delivery" class="w-full h-full object-contain rounded-xl">',
  '<img src="service_express_3d.webp" alt="Express Delivery" loading="lazy" decoding="async" class="w-full h-full object-contain rounded-xl">'
);
html = html.replace(
  '<img src="service_supply_3d.jpg" alt="Supply Chain" class="w-full h-full object-contain rounded-xl">',
  '<img src="service_supply_3d.webp" alt="Supply Chain" loading="lazy" decoding="async" class="w-full h-full object-contain rounded-xl">'
);
html = html.replace(
  '<img src="service_document_3d.jpg" alt="Document Courier" class="w-full h-full object-contain rounded-xl">',
  '<img src="service_document_3d.webp" alt="Document Courier" loading="lazy" decoding="async" class="w-full h-full object-contain rounded-xl">'
);
html = html.replace(
  '<img src="service_ftl_3d.jpg" alt="Full Truck Load" class="w-full h-full object-contain rounded-xl">',
  '<img src="service_ftl_3d.webp" alt="Full Truck Load" loading="lazy" decoding="async" class="w-full h-full object-contain rounded-xl">'
);
html = html.replace(
  '<img src="service_ptl_3d.jpg" alt="Part Truck Load" class="w-full h-full object-contain rounded-xl">',
  '<img src="service_ptl_3d.webp" alt="Part Truck Load" loading="lazy" decoding="async" class="w-full h-full object-contain rounded-xl">'
);
html = html.replace(
  '<img src="service_warehouse_3d.jpg" alt="Smart Warehousing" class="w-full h-full object-contain rounded-xl">',
  '<img src="service_warehouse_3d.webp" alt="Smart Warehousing" loading="lazy" decoding="async" class="w-full h-full object-contain rounded-xl">'
);

// 7. Footer Logo
html = html.replace(
  '<img src="maxline_logo_white.png" alt="MAXLINE LOGISTICS" class="h-10 sm:h-11 w-auto object-contain">',
  '<img src="maxline_logo_white.webp" alt="MAXLINE LOGISTICS" loading="lazy" decoding="async" class="h-10 sm:h-11 w-auto object-contain">'
);

// 8. Service Modal Preview Image
html = html.replace(
  '<img id="svc-modal-img" src="service_express_3d.jpg" alt="Service 3D Icon" class="w-full h-full object-contain rounded-xl">',
  '<img id="svc-modal-img" src="service_express_3d.webp" alt="Service 3D Icon" loading="lazy" decoding="async" class="w-full h-full object-contain rounded-xl">'
);

// 9. JavaScript servicesData icons
html = html.replace('icon: "service_express_3d.jpg"', 'icon: "service_express_3d.webp"');
html = html.replace('icon: "service_supply_3d.jpg"', 'icon: "service_supply_3d.webp"');
html = html.replace('icon: "service_document_3d.jpg"', 'icon: "service_document_3d.webp"');
html = html.replace('icon: "service_ftl_3d.jpg"', 'icon: "service_ftl_3d.webp"');
html = html.replace('icon: "service_ptl_3d.jpg"', 'icon: "service_ptl_3d.webp"');
html = html.replace('icon: "service_warehouse_3d.jpg"', 'icon: "service_warehouse_3d.webp"');

fs.writeFileSync(filePath, html, 'utf8');
console.log('Successfully updated index.html with optimized WebP images & lazy loading!');

// Also optimize the 5 policy pages
const policyFiles = [
  'privacy-policy.html',
  'terms-conditions.html',
  'refund-policy.html',
  'shipping-policy.html',
  'contact-us.html'
];

policyFiles.forEach(pf => {
  const pPath = path.join(__dirname, '..', pf);
  if (fs.existsSync(pPath)) {
    let pContent = fs.readFileSync(pPath, 'utf8');
    pContent = pContent.replace(
      '<img src="maxline_icon.png" alt="MAXLINE LOGISTICS" class="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl" onerror="this.style.display=\'none\'">',
      '<img src="maxline_icon.webp" alt="MAXLINE LOGISTICS" class="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl" onerror="this.src=\'maxline_icon.png\'">'
    );
    fs.writeFileSync(pPath, pContent, 'utf8');
    console.log('Optimized icon in', pf);
  }
});
