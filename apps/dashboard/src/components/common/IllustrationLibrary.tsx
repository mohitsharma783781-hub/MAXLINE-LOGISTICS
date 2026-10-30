import React from 'react';

// --- ENTERPRISE 3D LOGISTICS ILLUSTRATION LIBRARY ---

export interface IllustrationProps {
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}

/**
 * 1. 3D Enterprise Logistics Warehouse
 */
export const Warehouse3D: React.FC<IllustrationProps> = ({
  width = '100%',
  height = 'auto',
  className = '',
  style,
}) => (
  <svg
    viewBox="0 0 400 300"
    className={`drop-shadow-xl ${className}`}
    style={{ width, height, ...style }}
  >
    <defs>
      <linearGradient id="whWallLeft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="whWallRight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      <linearGradient id="whRoofLeft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="whRoofRight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="whDoor" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <radialGradient id="whShadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(15, 23, 42, 0.25)" />
        <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
      </radialGradient>
    </defs>

    {/* Ground Shadow */}
    <ellipse cx="200" cy="265" rx="170" ry="25" fill="url(#whShadow)" />

    {/* Main Warehouse Structure (Isometric) */}
    {/* Left Facade */}
    <polygon points="60,150 200,210 200,260 60,200" fill="url(#whWallLeft)" />
    {/* Right Facade */}
    <polygon points="200,210 340,150 340,200 200,260" fill="url(#whWallRight)" />

    {/* Gables */}
    <polygon points="60,150 200,90 200,210" fill="url(#whWallLeft)" opacity="0.9" />
    <polygon points="200,90 340,150 200,210" fill="url(#whWallRight)" opacity="0.9" />

    {/* 3D Roof Panels */}
    <polygon points="60,150 180,50 200,90" fill="url(#whRoofLeft)" />
    <polygon points="180,50 320,110 340,150 200,90" fill="url(#whRoofRight)" />

    {/* Loading Dock Doors */}
    <polygon points="110,195 160,217 160,243 110,221" fill="url(#whDoor)" />
    <line x1="110" y1="208" x2="160" y2="230" stroke="#b45309" strokeWidth="2" />
    <line x1="110" y1="214" x2="160" y2="236" stroke="#b45309" strokeWidth="2" />

    <polygon points="240,217 290,195 290,221 240,243" fill="url(#whDoor)" />
    <line x1="240" y1="230" x2="290" y2="208" stroke="#b45309" strokeWidth="2" />
    <line x1="240" y1="236" x2="290" y2="214" stroke="#b45309" strokeWidth="2" />

    {/* Enterprise Brand Shield */}
    <g transform="translate(180, 110) scale(0.8)">
      <polygon points="25,5 45,15 45,35 25,45 5,35 5,15" fill="#2563eb" />
      <polygon points="25,5 45,15 25,25 5,15" fill="#60a5fa" />
      <text x="25" y="32" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="900" fontFamily="sans-serif">
        C3
      </text>
    </g>
  </svg>
);

/**
 * 2. Modern 3D Logistics Delivery Van
 */
export const DeliveryVan3D: React.FC<IllustrationProps> = ({
  width = '100%',
  height = 'auto',
  className = '',
  style,
}) => (
  <svg
    viewBox="0 0 400 280"
    className={`drop-shadow-2xl ${className}`}
    style={{ width, height, filter: 'drop-shadow(0 20px 25px rgba(37, 99, 235, 0.2))', ...style }}
  >
    <defs>
      <linearGradient id="vanBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="50%" stopColor="#1d4ed8" />
        <stop offset="100%" stopColor="#1e40af" />
      </linearGradient>
      <linearGradient id="vanRoof" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
      <linearGradient id="accentOrange" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fb923c" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <linearGradient id="wheelRim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
    </defs>

    {/* Ground Shadow */}
    <ellipse cx="200" cy="235" rx="160" ry="22" fill="rgba(15, 23, 42, 0.18)" />

    {/* Speed Lines */}
    <path d="M 20 135 Q 50 135 70 140" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    <path d="M 10 165 Q 40 165 80 170" stroke="#f97316" strokeWidth="5" strokeLinecap="round" opacity="0.85" />

    {/* Van Main Body (3D Box) */}
    <rect x="90" y="80" width="220" height="110" rx="20" fill="url(#vanBody)" />
    <path d="M 90 100 Q 90 80 110 80 L 300 80 Q 310 80 310 95 L 310 110 L 90 110 Z" fill="url(#vanRoof)" opacity="0.8" />

    {/* Cabin Nose */}
    <path d="M 280 100 L 340 125 Q 355 135 355 155 L 355 190 L 290 190 Z" fill="url(#vanBody)" />
    {/* Windshield */}
    <path d="M 285 105 L 332 126 Q 340 132 338 145 L 285 145 Z" fill="#e0f2fe" opacity="0.95" />
    <path d="M 292 110 L 325 125 L 292 140 Z" fill="#ffffff" opacity="0.6" />

    {/* Express Cargo Stripe */}
    <path d="M 90 140 L 350 140 L 340 160 L 90 160 Z" fill="url(#accentOrange)" />

    {/* Enterprise Text */}
    <text x="210" y="125" fill="#ffffff" fontSize="17" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">
      COURRIER3
    </text>

    {/* 3D Wheels */}
    <g transform="translate(140, 190)">
      <circle cx="0" cy="0" r="28" fill="#0f172a" />
      <circle cx="0" cy="0" r="18" fill="url(#wheelRim)" />
      <circle cx="0" cy="0" r="8" fill="#2563eb" />
    </g>
    <g transform="translate(300, 190)">
      <circle cx="0" cy="0" r="28" fill="#0f172a" />
      <circle cx="0" cy="0" r="18" fill="url(#wheelRim)" />
      <circle cx="0" cy="0" r="8" fill="#2563eb" />
    </g>
  </svg>
);

/**
 * 3. Enterprise Courier Parcels & Freight Boxes
 */
export const CourierParcels3D: React.FC<IllustrationProps> = ({
  width = '100%',
  height = 'auto',
  className = '',
  style,
}) => (
  <svg viewBox="0 0 200 200" className={`drop-shadow-lg ${className}`} style={{ width, height, ...style }}>
    <defs>
      <linearGradient id="pBoxTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <linearGradient id="pBoxLeft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="pBoxRight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    <polygon points="100,25 170,60 100,95 30,60" fill="url(#pBoxTop)" />
    <polygon points="30,60 100,95 100,165 30,130" fill="url(#pBoxLeft)" />
    <polygon points="100,95 170,60 170,130 100,165" fill="url(#pBoxRight)" />
    {/* Security Tape */}
    <polygon points="85,32 115,47 100,95 70,80" fill="#ef4444" opacity="0.9" />
    <polygon points="70,80 100,95 100,165 70,150" fill="#dc2626" opacity="0.9" />
  </svg>
);

/**
 * 4. 3D Live Tracking Analytics Dashboard
 */
export const TrackingDashboard3D: React.FC<IllustrationProps> = ({
  width = '100%',
  height = 'auto',
  className = '',
  style,
}) => (
  <svg viewBox="0 0 360 260" className={`drop-shadow-2xl ${className}`} style={{ width, height, ...style }}>
    <rect x="20" y="20" width="320" height="220" rx="16" fill="#0f172a" />
    <rect x="35" y="35" width="290" height="190" rx="10" fill="#1e293b" />
    {/* Top Header */}
    <circle cx="55" cy="52" r="5" fill="#ef4444" />
    <circle cx="70" cy="52" r="5" fill="#f59e0b" />
    <circle cx="85" cy="52" r="5" fill="#10b981" />

    {/* Radar Tracking Map Lines */}
    <path d="M 60 140 Q 140 80 220 150 T 300 110" stroke="#2563eb" strokeWidth="4" fill="none" strokeDasharray="6 4" />
    <circle cx="140" cy="115" r="8" fill="#38bdf8" />
    <circle cx="220" cy="150" r="10" fill="#22c55e" />

    {/* Analytics Bars */}
    <rect x="55" y="170" width="30" height="35" rx="4" fill="#2563eb" />
    <rect x="95" y="150" width="30" height="55" rx="4" fill="#38bdf8" />
    <rect x="135" y="180" width="30" height="25" rx="4" fill="#64748b" />
  </svg>
);

/**
 * 5. Professional Logistics Operations Character / Manager
 */
export const LogisticsCharacter3D: React.FC<IllustrationProps> = ({
  width = '100%',
  height = 'auto',
  className = '',
  style,
}) => (
  <svg viewBox="0 0 200 240" className={`drop-shadow-lg ${className}`} style={{ width, height, ...style }}>
    <circle cx="100" cy="65" r="35" fill="#38bdf8" />
    <path d="M 40 210 Q 40 130 100 130 Q 160 130 160 210 Z" fill="#0f172a" />
    <polygon points="70,135 100,165 130,135 145,210 55,210" fill="#f59e0b" />
    <rect x="85" y="145" width="30" height="65" fill="#ffffff" opacity="0.4" />
    <rect x="130" y="150" width="40" height="55" rx="6" fill="#f1f5f9" stroke="#0f172a" strokeWidth="3" />
    <line x1="140" y1="165" x2="160" y2="165" stroke="#2563eb" strokeWidth="3" />
    <line x1="140" y1="175" x2="160" y2="175" stroke="#16a34a" strokeWidth="3" />
  </svg>
);

/**
 * 6. Warehouse Operations & Conveyor Sorting
 */
export const WarehouseOperations3D: React.FC<IllustrationProps> = ({
  width = '100%',
  height = 'auto',
  className = '',
  style,
}) => (
  <svg viewBox="0 0 340 220" className={`drop-shadow-xl ${className}`} style={{ width, height, ...style }}>
    <polygon points="30,160 310,160 280,190 60,190" fill="#334155" />
    <line x1="30" y1="160" x2="310" y2="160" stroke="#0284c7" strokeWidth="4" />
    <rect x="70" y="125" width="40" height="35" rx="4" fill="#fbbf24" />
    <rect x="150" y="115" width="45" height="45" rx="4" fill="#f97316" />
    <rect x="230" y="130" width="35" height="30" rx="4" fill="#38bdf8" />
  </svg>
);
