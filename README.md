# MaxLine 3D — Next-Gen Multi-Carrier Logistics Platform

A vibrant, visually rich, and action-first SaaS Landing Page engineered for a multi-carrier logistics and cargo aggregation platform.

---

## 🎨 3D Claymorphic Design System & Visual Direction

| Dimension | Specification | Implementation Detail |
| :--- | :--- | :--- |
| **Visual Vibe** | Playful yet professional 3D Claymorphism & Isometrics | Smooth rounded forms, ambient drop-shadows, tactile button states (`shadow-clay-btn`), and sub-pixel glass highlights. |
| **Visual Centerpiece** | Floating 3D Logistics Composition | Handcrafted vector SVG 3D yellow electric delivery van bursting out of a shipping box, accompanied by a miniature cargo airplane, route map pins, and speed streaks. |
| **Micro-Animations** | Floating CSS Keyframe Hover Animations | `@keyframes float-van`, `@keyframes float-box`, `@keyframes float-plane`, `@keyframes float-pin` with snappy hover transitions (`transform: translateY(-8px)`). |
| **Color Atmosphere** | Deep Space Navy + Dual Radial Glows | Base `#0A0F1D` highlighted by electric blue (`#2563EB`) and warm orange (`#F97316`) radial backdrops. |
| **Layout Philosophy** | Action-First, Zero Fluff | Maximum operational utility placed directly above the fold. |

---

## ⚡ Core Sections & Action Blocks

### 1. Dynamic Glass Top Bar
- **Floating Pill Design**: Centered `max-w-[1280px]` rounded-full bar with `backdrop-blur-xl` and `border: 1px solid rgba(255, 255, 255, 0.12)`.
- **Brand Logo**: High-contrast typography paired with an isometric 3D miniature parcel icon.
- **Quick Links**: Direct tabs for "📍 Pincode Check", "🔍 Track AWB", and "⚡ Rates".
- **Tactile Auth CTA**: Glowing gradient "Login / Register" button with physical depth depression on active click.

### 2. Hero Zone (Split Layout)
- **Punchy Tagline**: `"Ship Smarter with 10+ Courier Networks."`
- **Sub-headline**: `"Live multi-carrier rates, instant AWB generation, and automated NDR control. Zero monthly platform fees."`
- **3D Centerpiece**: High-density 3D vector scene featuring the yellow electric delivery van bursting out of a cardboard package with motion streaks and ambient lighting.

### 3. The Master 3-in-1 Quick-Action Utility Hub
Positioned directly above the fold with 3 prominent interactive tabs:

- **Tab 1: 📍 Check Pincode Serviceability**
  - Origin Pincode + Destination Pincode search bar.
  - Live output showing direct routing status across 5 integrated partners (Delhivery, Xpressbees, DTDC, Gati, Smartr).
  - Mode availability badges: `[ Cash on Delivery: Available (Max ₹50k) ]`, `[ Prepaid: Available ]`, `[ Pickup Available: Today before 4 PM ]`.
- **Tab 2: 🔍 Live AWB / LR Tracking**
  - Dual Mode Switch: `[ B2C Express AWB ]` | `[ B2B Cargo LR Number ]`.
  - Instant query input with sample test buttons (`1420984521`, `LR-88902-BLR`).
  - Output Stepper: Interactive 4-step progress stepper (`Order Placed → Picked Up → In Transit → Out for Delivery`).
- **Tab 3: ⚡ Instant Rate Calculator**
  - Origin, Destination, Dead Weight (kg), and volumetric `L x W x H` cm dimensions.
  - Live volumetric calculation formula: `(L*W*H)/5000` with real-time billable weight calculation.
  - Side-by-side comparative cards: Delhivery Surface, Air Express Priority, and Xpressbees Surface with total estimated pricing (including FSC, Docket fees, and 18% GST).

### 4. Partner Strip
- Horizontal display of integrated tier-1 carriers (Delhivery, Xpressbees, DTDC, Gati, Amazon Shipping) styled with glossy 3D metallic pill borders and carrier status tags.

---

## 🚀 Live Preview & Running Locally

The local server is already running in the background:
👉 **[http://localhost:3000](http://localhost:3000)**

You can also open the file directly in any browser:
👉 [**`index.html`**](file:///c:/Users/mohit/Desktop/Max%20line/index.html)

For React / Next.js projects, import:
- [**`Vibrant3DLandingPage.tsx`**](file:///c:/Users/mohit/Desktop/Max%20line/Vibrant3DLandingPage.tsx) — Full drop-in React/TypeScript component.
