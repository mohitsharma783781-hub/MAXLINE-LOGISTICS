import React from 'react';
import {
  Wallet,
  Package,
  Truck,
  CheckCircle2,
  IndianRupee,
  PlusCircle,
  Search,
  Building2,
  Receipt,
  CreditCard,
  Globe,
  ShieldCheck,
  Calculator,
} from 'lucide-react';

export type ThreeDIconType =
  | 'wallet'
  | 'orders'
  | 'transit'
  | 'delivered'
  | 'cod'
  | 'shipment_create'
  | 'all_orders'
  | 'track'
  | 'recharge'
  | 'warehouse'
  | 'invoices'
  | 'globe'
  | 'shield'
  | 'calculator';

interface ThreeDIconProps {
  type: ThreeDIconType;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const ICON_CONFIG: Record<
  ThreeDIconType,
  {
    icon: React.ElementType;
    gradient: string;
    shadowColor: string;
    glowColor: string;
    borderHighlight: string;
  }
> = {
  wallet: {
    icon: Wallet,
    gradient: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 50%, #581c87 100%)',
    shadowColor: 'rgba(126, 34, 206, 0.4)',
    glowColor: '#e9d5ff',
    borderHighlight: 'rgba(233, 213, 255, 0.5)',
  },
  orders: {
    icon: Package,
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)',
    shadowColor: 'rgba(29, 78, 216, 0.4)',
    glowColor: '#bfdbfe',
    borderHighlight: 'rgba(191, 219, 254, 0.5)',
  },
  transit: {
    icon: Truck,
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 50%, #075985 100%)',
    shadowColor: 'rgba(3, 105, 161, 0.4)',
    glowColor: '#bae6fd',
    borderHighlight: 'rgba(186, 230, 253, 0.5)',
  },
  delivered: {
    icon: CheckCircle2,
    gradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 50%, #14532d 100%)',
    shadowColor: 'rgba(21, 128, 61, 0.4)',
    glowColor: '#bbf7d0',
    borderHighlight: 'rgba(187, 247, 208, 0.5)',
  },
  cod: {
    icon: IndianRupee,
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 50%, #78350f 100%)',
    shadowColor: 'rgba(180, 83, 9, 0.4)',
    glowColor: '#fde68a',
    borderHighlight: 'rgba(253, 230, 138, 0.5)',
  },
  shipment_create: {
    icon: PlusCircle,
    gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    shadowColor: 'rgba(37, 99, 235, 0.35)',
    glowColor: '#dbeafe',
    borderHighlight: 'rgba(219, 234, 254, 0.6)',
  },
  all_orders: {
    icon: Package,
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    shadowColor: 'rgba(2, 132, 199, 0.35)',
    glowColor: '#e0f2fe',
    borderHighlight: 'rgba(224, 242, 254, 0.6)',
  },
  track: {
    icon: Search,
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    shadowColor: 'rgba(124, 58, 237, 0.35)',
    glowColor: '#ede9fe',
    borderHighlight: 'rgba(237, 233, 254, 0.6)',
  },
  recharge: {
    icon: CreditCard,
    gradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    shadowColor: 'rgba(22, 163, 74, 0.35)',
    glowColor: '#dcfce7',
    borderHighlight: 'rgba(220, 252, 231, 0.6)',
  },
  warehouse: {
    icon: Building2,
    gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    shadowColor: 'rgba(217, 119, 6, 0.35)',
    glowColor: '#fef3c7',
    borderHighlight: 'rgba(254, 243, 199, 0.6)',
  },
  invoices: {
    icon: Receipt,
    gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    shadowColor: 'rgba(220, 38, 38, 0.35)',
    glowColor: '#fee2e2',
    borderHighlight: 'rgba(254, 226, 226, 0.6)',
  },
  globe: {
    icon: Globe,
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    shadowColor: 'rgba(2, 132, 199, 0.35)',
    glowColor: '#e0f2fe',
    borderHighlight: 'rgba(224, 242, 254, 0.6)',
  },
  shield: {
    icon: ShieldCheck,
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    shadowColor: 'rgba(16, 185, 129, 0.35)',
    glowColor: '#d1fae5',
    borderHighlight: 'rgba(209, 250, 229, 0.6)',
  },
  calculator: {
    icon: Calculator,
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    shadowColor: 'rgba(2, 132, 199, 0.35)',
    glowColor: '#e0f2fe',
    borderHighlight: 'rgba(224, 242, 254, 0.6)',
  },
};

export const ThreeDIcon: React.FC<ThreeDIconProps> = ({
  type,
  size = 'md',
}) => {
  const config = ICON_CONFIG[type] || ICON_CONFIG.orders;
  const IconComponent = config.icon;

  const dimensions =
    size === 'sm'
      ? { box: 36, icon: 18, radius: 10 }
      : size === 'lg'
      ? { box: 52, icon: 26, radius: 16 }
      : { box: 44, icon: 22, radius: 12 };

  return (
    <div
      style={{
        width: `${dimensions.box}px`,
        height: `${dimensions.box}px`,
        borderRadius: `${dimensions.radius}px`,
        background: config.gradient,
        boxShadow: `0 6px 14px -2px ${config.shadowColor}, inset 0 1.5px 2px rgba(255, 255, 255, 0.45)`,
        borderTop: `1.5px solid ${config.borderHighlight}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        flexShrink: 0,
        position: 'relative',
        transform: 'perspective(500px) rotateX(6deg) rotateY(-4deg)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <IconComponent
        size={dimensions.icon}
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25))',
        }}
      />
    </div>
  );
};
