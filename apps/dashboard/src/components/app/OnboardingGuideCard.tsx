import React from 'react';
import { Truck, ShoppingCart, Plus, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface OnboardingGuideCardProps {
  onActionClick?: (stepKey: string) => void;
}

export const OnboardingGuideCard: React.FC<OnboardingGuideCardProps> = ({ onActionClick }) => {
  const steps = [
    {
      key: 'courier',
      stepNum: 'Step 1',
      title: 'Connect a courier partner',
      desc: 'Plug in your courier API credentials or use platform rate cards.',
      icon: Truck,
      buttonText: 'Manage Couriers',
    },
    {
      key: 'orders',
      stepNum: 'Step 2',
      title: 'Add your first order',
      desc: 'Sync orders automatically via Shopify, WooCommerce, or API.',
      icon: ShoppingCart,
      buttonText: 'Sync Orders',
    },
    {
      key: 'shipment',
      stepNum: 'Step 3',
      title: 'Create your first shipment',
      desc: 'Generate shipping labels and dispatch your first parcel.',
      icon: Plus,
      buttonText: 'Create Shipment',
    },
  ];

  return (
    <Card style={{ padding: 'var(--space-8)', border: '1px solid var(--color-violet-light)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <Badge variant="brand">Merchant Onboarding Guide</Badge>
              <Badge variant="neutral">3 Quick Steps</Badge>
            </div>
            <h3 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
              Let's get your shipping operation ready.
            </h3>
            <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
              Follow these simple steps to start creating shipments and tracking dispatches.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)' }}>
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.key} style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'var(--color-surface-secondary)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-default)', backgroundColor: 'var(--color-violet-light)', color: 'var(--color-violet-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} />
                    </div>
                    <span style={{ fontSize: 'var(--font-size-caption)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-violet-main)' }}>
                      {step.stepNum}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                    {step.title}
                  </h4>
                  <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', marginBottom: 'var(--space-4)' }}>
                    {step.desc}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  rightIcon={<ArrowRight size={14} />}
                  onClick={() => onActionClick?.(step.key)}
                >
                  {step.buttonText}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
