import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Rocket, AlertCircle, ChevronRight, ChevronDown, Check, ArrowRight, X } from 'lucide-react';
import { Button, Card, Badge } from '../ui';
import {
  OnboardingService,
  ONBOARDING_STAGES_CONFIG,
} from '../../services/onboardingService';
import type { CustomerOnboardingRecord } from '../../services/onboardingService';

interface OnboardingTrackerCardProps {
  customerId?: string;
  onGoLiveSuccess?: () => void;
  autoHideIfComplete?: boolean;
}

export const OnboardingTrackerCard: React.FC<OnboardingTrackerCardProps> = ({
  customerId = 'CUST-1001',
  autoHideIfComplete = true,
}) => {
  const navigate = useNavigate();
  const [record, setRecord] = useState<CustomerOnboardingRecord>(() =>
    OnboardingService.getCustomerOnboarding(customerId)
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  const goLiveCheck = OnboardingService.validateGoLiveRules(customerId);

  const handleSimulateStep = (stageNum: number) => {
    const updated = OnboardingService.markStageComplete(customerId, stageNum);
    setRecord(updated);
  };

  // Auto-hide onboarding banner when 100% complete or dismissed to keep dashboard clean & uncluttered
  if (isDismissed || (autoHideIfComplete && (record.isGoLive || record.completionPercentage >= 100))) {
    return null;
  }

  return (
    <Card
      style={{
        padding: 'var(--space-6)',
        backgroundColor: '#ffffff',
        border: record.isGoLive ? '1px solid var(--color-success-main, #22c55e)' : '1px solid #3b82f6',
        borderRadius: 'var(--radius-lg, 16px)',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        width: '100%',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: record.isGoLive ? '#dcfce7' : '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: record.isGoLive ? '#16a34a' : '#2563eb',
            }}
          >
            {record.isGoLive ? <Rocket size={24} /> : <Clock size={24} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>
                Account Onboarding Progress
              </h3>
              <Badge variant={record.isGoLive ? 'success' : record.completionPercentage >= 85 ? 'warning' : 'brand'}>
                {record.isGoLive ? 'LIVE ACCOUNT' : `${record.completionPercentage}% COMPLETE`}
              </Badge>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, marginTop: '2px' }}>
              {record.isGoLive
                ? 'Your account is 100% verified and active for live shipping dispatches.'
                : `Current Stage: ${record.currentStageTitle} (${record.stages.filter((s) => s.isComplete).length} of 9 steps verified)`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            rightIcon={isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          >
            {isExpanded ? 'Hide Steps' : 'View All 9 Stages'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDismissed(true)}
            style={{ color: '#64748b', borderColor: '#cbd5e1' }}
            title="Dismiss Onboarding Banner"
          >
            <X size={14} style={{ marginRight: '4px' }} /> Dismiss
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Onboarding Journey</span>
          <span style={{ color: record.isGoLive ? '#16a34a' : '#2563eb' }}>{record.completionPercentage}%</span>
        </div>
        <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${record.completionPercentage}%`,
              height: '100%',
              backgroundColor: record.isGoLive ? '#22c55e' : '#2563eb',
              transition: 'width 0.5s ease-in-out',
            }}
          />
        </div>
      </div>

      {/* Missing Requirements Warning Banner if not live */}
      {!record.isGoLive && goLiveCheck.missingRequirements.length > 0 && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
            color: '#92400e',
          }}
        >
          <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Go-Live Readiness Check:</strong> Complete the remaining items before live order booking:
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              {goLiveCheck.missingRequirements.map((req) => (
                <Badge key={req} variant="warning" style={{ fontSize: '11px' }}>
                  ⏳ {req}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timeline View (Stages 1 to 9) */}
      {isExpanded && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-2)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {ONBOARDING_STAGES_CONFIG.map((cfg) => {
            const st = record.stages.find((s) => s.stageNumber === cfg.stageNumber);
            const isDone = Boolean(st?.isComplete);
            const isCurrent = record.currentStageNumber === cfg.stageNumber;

            return (
              <div
                key={cfg.id}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border: isDone
                    ? '1px solid #bbf7d0'
                    : isCurrent
                    ? '2px solid #3b82f6'
                    : '1px solid #e2e8f0',
                  backgroundColor: isDone ? '#f0fdf4' : isCurrent ? '#eff6ff' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isDone ? '#22c55e' : isCurrent ? '#2563eb' : '#cbd5e1',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {isDone ? <Check size={14} /> : cfg.stageNumber}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                      Stage {cfg.stageNumber}: {cfg.title}
                    </span>
                    {isDone ? (
                      <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>✓ Done</span>
                    ) : isCurrent ? (
                      <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 'bold' }}>⏳ Current</span>
                    ) : null}
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
                    {cfg.description}
                  </p>

                  {/* CTA button for pending/current step */}
                  {!isDone && cfg.actionUrl && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        rightIcon={<ArrowRight size={12} />}
                        onClick={() => navigate(cfg.actionUrl!)}
                        style={{ fontSize: '11px', padding: '2px 8px' }}
                      >
                        {cfg.actionLabel || 'Complete Step'}
                      </Button>

                      {/* Simulation Trigger for Testing */}
                      <button
                        onClick={() => handleSimulateStep(cfg.stageNumber)}
                        style={{
                          fontSize: '10px',
                          color: '#64748b',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        (Mark Complete)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
