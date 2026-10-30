import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Power,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Table,
  Alert,
} from '../../components/ui';
import { type NotificationRule } from '../../types/notifications';
import { demoNotificationProvider } from '../../mocks/notifications.mock';

export const NotificationRulesPage: React.FC = () => {
  const navigate = useNavigate();

  const [rules, setRules] = useState<NotificationRule[]>(() =>
    demoNotificationProvider.getRules()
  );

  const handleToggle = (id: string, currentEnabled: boolean) => {
    demoNotificationProvider.toggleRule(id, !currentEnabled);
    setRules(demoNotificationProvider.getRules());
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Notifications', path: '/app/notifications' },
    { label: 'Notification Rules', path: '/app/notifications/rules' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="Notification Dispatch Rules"
        description="Configure automated messaging rules linked to shipment lifecycle tracking events."
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/app/notifications')} leftIcon={<ArrowLeft size={16} />}>
            Back to Notifications
          </Button>
        }
      />

      <Alert variant="info" title="Event-Driven Rule Engine">
        When a shipment tracking event triggers (e.g. SHIPMENT_BOOKED or OUT_FOR_DELIVERY), enabled notification rules automatically queue the corresponding template for customer messaging.
      </Alert>

      {/* Rules Table */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <Table<NotificationRule>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'event',
              header: 'Lifecycle Event Trigger',
              render: (row) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{row.event}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Rule ID: {row.id}
                  </div>
                </div>
              ),
            },
            {
              key: 'channel',
              header: 'Channel',
              render: (row) => (
                <Badge variant={row.channel === 'WHATSAPP' ? 'success' : row.channel === 'SMS' ? 'info' : 'brand'}>
                  {row.channel}
                </Badge>
              ),
            },
            {
              key: 'templateName',
              header: 'Linked Template',
              render: (row) => <span>{row.templateName}</span>,
            },
            {
              key: 'enabled',
              header: 'Rule Status',
              render: (row) => (
                <Badge variant={row.enabled ? 'success' : 'neutral'}>
                  {row.enabled ? 'ENABLED' : 'DISABLED'}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <Button
                  variant={row.enabled ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => handleToggle(row.id, row.enabled)}
                  leftIcon={<Power size={14} />}
                >
                  {row.enabled ? 'Disable' : 'Enable'}
                </Button>
              ),
            },
          ]}
          data={rules}
        />
      </Card>
    </div>
  );
};
