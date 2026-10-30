import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Alert,
  ConfirmationDialog,
} from '../../components/ui';
import { demoNotificationProvider } from '../../mocks/notifications.mock';
import {
  type NotificationLog,
  NOTIFICATION_STATUS_CONFIG,
} from '../../types/notifications';

export const NotificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<NotificationLog | null>(null);
  const [isRetryDialogOpen, setIsRetryDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const targetId = id || 'log-101';
    const match = demoNotificationProvider.getLogById(targetId);
    setDetail(match ? { ...match } : null);
  }, [id]);

  const handleConfirmRetry = () => {
    if (!detail) return;
    const updated = demoNotificationProvider.retryNotification(detail.id);
    if (updated) setDetail({ ...updated });
    setIsRetryDialogOpen(false);
  };

  const statusConfig = NOTIFICATION_STATUS_CONFIG.find((c) => c.key === detail?.status) || {
    label: detail?.status || 'Pending',
    variant: 'neutral' as const,
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Notifications', path: '/app/notifications' },
    { label: detail?.id || id || 'Detail', path: `/app/notifications/${id}` },
  ];

  if (!detail) {
    return (
      <Card style={{ padding: 'var(--space-8)' }}>
        <div>Loading notification log...</div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title={`Notification Log #${detail.id}`}
        description={`${detail.shipmentId} • AWB ${detail.awb} • Sent via ${detail.channel}`}
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => navigate('/app/notifications')}
            >
              Back to Notifications
            </Button>

            {detail.status === 'FAILED' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<RotateCcw size={16} />}
                onClick={() => setIsRetryDialogOpen(true)}
              >
                Retry Notification
              </Button>
            )}
          </div>
        }
      />

      {/* Log Overview Card */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
          <div>
            <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', display: 'block' }}>
              Dispatch Status
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: '4px' }}>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              <Badge variant={detail.channel === 'WHATSAPP' ? 'success' : detail.channel === 'SMS' ? 'info' : 'brand'}>
                {detail.channel}
              </Badge>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
            <div>Sent: {detail.createdAt}</div>
            <div>Ref: {detail.providerReference || 'N/A'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Recipient (Masked PII)</span>
            <div style={{ fontWeight: 'bold' }}>👤 {detail.recipientMasked}</div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Trigger Lifecycle Event</span>
            <div style={{ fontWeight: 'bold' }}>{detail.notificationEvent}</div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Linked Template</span>
            <div style={{ fontWeight: 'bold' }}>{detail.templateName}</div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Gateway Provider</span>
            <div style={{ fontWeight: 'bold' }}>{detail.provider}</div>
          </div>
        </div>
      </Card>

      {/* ERROR ALERT IF FAILED */}
      {detail.status === 'FAILED' && (
        <Alert variant="danger" title="Dispatch Failed">
          {detail.errorMessage || 'Notification provider returned gateway error. Click Retry to re-send.'}
        </Alert>
      )}

      {/* RENDERED MESSAGE CONTENT CARD */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
          Rendered Message Payload
        </h4>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--color-surface-secondary)',
            borderRadius: 'var(--radius-default)',
            border: '1px solid var(--color-border)',
            fontFamily: 'monospace',
            fontSize: '13px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {detail.renderedContent || 'No message content available.'}
        </div>
      </Card>

      {/* RETRY DIALOG */}
      <ConfirmationDialog
        isOpen={isRetryDialogOpen}
        onClose={() => setIsRetryDialogOpen(false)}
        onConfirm={handleConfirmRetry}
        title="Retry Dispatch?"
        description="Re-queue notification message for delivery via DemoNotificationProvider."
        confirmLabel="Retry Send"
        cancelLabel="Cancel"
        variant="primary"
      />
    </div>
  );
};
