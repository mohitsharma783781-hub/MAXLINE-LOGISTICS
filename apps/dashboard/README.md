# 🚀 Courrier3 — Enterprise Multi-Courier Shipping & Logistics SaaS Platform

![Courrier3 Banner](https://img.shields.io/badge/Courrier3-Logistics_SaaS-2563eb?style=for-the-badge&logo=rocket)
![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

**Courrier3** is a high-performance, enterprise-grade Multi-Courier Logistics & Shipping SaaS platform built for fast-growing D2C brands, e-commerce merchants, and logistics aggregators across India.

---

## 🌟 Key Platform Features

- 🚚 **Multi-Courier Integration Engine**: Single-dashboard API connectivity for 12+ national courier partners (*Delhivery, Blue Dart, Xpressbees, Shadowfax, DTDC, Ecom Express, Amazon Shipping*).
- 🤖 **AI Smart Courier Recommendation**: Real-time evaluation engine calculating **🏆 Best Value (Cheapest)**, **⚡ Fastest SLA**, and **Recommended** courier allocations.
- 📦 **End-to-End Shipment Management**: Single & Bulk shipment creation wizards, live tracking timelines, and automated barcode shipping label downloads.
- 🛡️ **NDR & RTO Loss Reduction Hub**: Interactive Non-Delivery Report console with automated buyer WhatsApp re-attempt triggers, cutting return losses by up to 40%.
- 💳 **Daily COD Remittance & Wallet Vault**: Fast daily Cash-On-Delivery bank settlements with automated ledgers and wallet recharge wizards.
- 🔒 **Role-Based Access Control (RBAC)**: Dual portal architecture with granular access control for **Merchant Portal** (`/app`) and **Admin Portal** (`/admin`).
- ⚡ **Interactive Landing Page**: Built-in freight rate calculator, 29,000+ pincode serviceability checker, live AWB timeline drawer, and carrier partner showcases.

---

## 🏗️ Tech Stack

- **Frontend Core**: React 18, TypeScript, Vite
- **Routing & Navigation**: React Router DOM (v6)
- **Iconography & Visual System**: Lucide React Icons & Custom Glassmorphism Token Architecture
- **State & Auth Management**: Context API (RbacContext, AuthContext) & LocalStorage Persistence
- **Styling Architecture**: Modular Design Tokens (`tokens.css`), Glassmorphism Utilities, `@keyframes` Physics

---

## 📁 Repository Structure

```
Courrier3/
├── public/
│   ├── images/              # Static platform visual assets
│   └── _redirects           # Netlify SPA routing rules
├── src/
│   ├── components/          # Reusable UI primitives (Button, Card, Badge, Modal, Table, etc.)
│   ├── config/              # Application global configuration (`app.config.ts`)
│   ├── context/             # RBAC and Auth State Context Providers
│   ├── hooks/               # Custom React hooks (`useBreakpoints`, etc.)
│   ├── layouts/             # AppLayout, AdminLayout, AuthLayout, PublicWebsiteLayout
│   ├── pages/               # LandingPage, LoginPage, SignupPage, Merchant Dashboard, Admin Dashboard
│   ├── services/            # Mock API & Data Services (Auth, Customer Rate Assignment, Shipments)
│   ├── styles/              # Global styles, Design Tokens (`tokens.css`), Keyframe Animations
│   └── types/               # TypeScript Interfaces and Data Schemas
├── vercel.json              # Vercel SPA routing rewrite rules
├── package.json             # Dependencies and build scripts
└── tsconfig.json            # TypeScript compiler configuration
```

---

## ⚡ Quick Start & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/courrier3.git
cd courrier3
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start local development server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```

### 5. Preview Production Build
```bash
npm run preview
```

---

## 🚀 One-Click GitHub & Cloud Deployment

### Deploying to Vercel
1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Vercel will automatically detect Vite and use `npm run build` with `dist/` output.
4. `vercel.json` ensures all client-side routes (`/login`, `/signup`, `/app`, `/admin`) reload smoothly without 404s.

### Deploying to Netlify
1. Import your GitHub repository in [Netlify](https://netlify.com).
2. Build Command: `npm run build`
3. Publish Directory: `dist`
4. `public/_redirects` ensures SPA routing works out of the box.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
