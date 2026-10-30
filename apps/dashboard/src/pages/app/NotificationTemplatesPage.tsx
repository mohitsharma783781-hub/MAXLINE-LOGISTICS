import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Table,
  Modal,
  Input,
  Select,
  Alert,
} from '../../components/ui';
import {
  type NotificationTemplate,
  type NotificationChannel,
  type NotificationEvent,
  ALLOWED_NOTIFICATION_VARIABLES,
} from '../../types/notifications';
import {
  demoNotificationProvider,
  renderTemplateBody,
} from '../../mocks/notifications.mock';

export const NotificationTemplatesPage: React.FC = () => {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<NotificationTemplate[]>(() =>
    demoNotificationProvider.getTemplates()
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [event, setEvent] = useState<NotificationEvent>('SHIPMENT_BOOKED');
  const [channel, setChannel] = useState<NotificationChannel>('WHATSAPP');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const openCreateModal = () => {
    setEditingTemplate(null);
    setName('');
    setEvent('SHIPMENT_BOOKED');
    setChannel('WHATSAPP');
    setSubject('');
    setBody('Hello {{customer_name}}, your order {{order_id}} has been booked with {{courier_name}}. Track: {{tracking_url}}');
    setIsModalOpen(true);
  };

  const openEditModal = (tmpl: NotificationTemplate) => {
    setEditingTemplate(tmpl);
    setName(tmpl.name);
    setEvent(tmpl.event);
    setChannel(tmpl.channel);
    setSubject(tmpl.subject || '');
    setBody(tmpl.body);
    setIsModalOpen(true);
  };

  const insertVariable = (varKey: string) => {
    setBody((prev) => `${prev} ${varKey}`);
  };

  const handleSaveTemplate = () => {
    if (!name.trim() || !body.trim()) return;

    const usedVars = ALLOWED_NOTIFICATION_VARIABLES.filter((v) => body.includes(v.key)).map((v) => v.key);

    if (editingTemplate) {
      demoNotificationProvider.updateTemplate(editingTemplate.id, {
        name,
        event,
        channel,
        subject: channel === 'EMAIL' ? subject : undefined,
        body,
        variables: usedVars,
      });
    } else {
      demoNotificationProvider.createTemplate({
        name,
        event,
        channel,
        subject: channel === 'EMAIL' ? subject : undefined,
        body,
        status: 'ACTIVE',
        variables: usedVars,
      });
    }

    setTemplates(demoNotificationProvider.getTemplates());
    setIsModalOpen(false);
  };

  const previewRendered = renderTemplateBody(body, {
    customer_name: 'Rahul Sharma',
    order_id: 'ORD-9840192',
    awb: 'DEMO-AWB-98401928',
    courier_name: 'Delhivery Surface',
    tracking_url: 'https://demo.shipping-saas.com/track/DEMO-AWB-98401928',
  });

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Notifications', path: '/app/notifications' },
    { label: 'Templates', path: '/app/notifications/templates' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title="Message Templates"
        description="Design reusable WhatsApp, SMS, and Email notification templates with dynamic merge variables."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/notifications')} leftIcon={<ArrowLeft size={16} />}>
              Back to Notifications
            </Button>
            <Button variant="primary" size="sm" onClick={openCreateModal} leftIcon={<Plus size={16} />}>
              + Create Template
            </Button>
          </div>
        }
      />

      {/* Templates Table */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <Table<NotificationTemplate>
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'name',
              header: 'Template Name',
              render: (row) => (
                <div>
                  <strong style={{ color: 'var(--color-violet-main)' }}>{row.name}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    ID: {row.id}
                  </div>
                </div>
              ),
            },
            {
              key: 'event',
              header: 'Trigger Event',
              render: (row) => <Badge variant="neutral">{row.event}</Badge>,
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
              key: 'variables',
              header: 'Variables Count',
              render: (row) => <span>{row.variables.length} Variables</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'}>{row.status}</Badge>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button variant="outline" size="sm" onClick={() => openEditModal(row)}>
                    Edit
                  </Button>
                </div>
              ),
            },
          ]}
          data={templates}
        />
      </Card>

      {/* CREATE / EDIT TEMPLATE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTemplate ? 'Edit Message Template' : 'Create New Message Template'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Out for Delivery WhatsApp Alert"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Select
              label="Trigger Event"
              value={event}
              onChange={(e) => setEvent(e.target.value as NotificationEvent)}
              options={[
                { value: 'SHIPMENT_BOOKED', label: 'Shipment Booked' },
                { value: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled' },
                { value: 'SHIPMENT_PICKED_UP', label: 'Shipment Picked Up' },
                { value: 'IN_TRANSIT', label: 'In Transit' },
                { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
                { value: 'NDR_CREATED', label: 'Delivery Attempt Failed (NDR)' },
                { value: 'DELIVERED', label: 'Delivered' },
                { value: 'RTO_INITIATED', label: 'RTO Initiated' },
              ]}
            />

            <Select
              label="Communication Channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value as NotificationChannel)}
              options={[
                { value: 'WHATSAPP', label: 'WhatsApp Message' },
                { value: 'SMS', label: 'SMS Text Message' },
                { value: 'EMAIL', label: 'Email Document' },
              ]}
            />
          </div>

          {channel === 'EMAIL' && (
            <Input
              label="Email Subject Line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Your shipment {{awb}} is out for delivery!"
            />
          )}

          {/* VARIABLE PICKER BUTTONS */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
              Insert Dynamic Variable:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {ALLOWED_NOTIFICATION_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-violet-main)',
                    backgroundColor: 'rgba(124, 58, 237, 0.08)',
                    color: 'var(--color-violet-main)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  + {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* MESSAGE BODY TEXTAREA */}
          <div>
            <label style={{ fontSize: 'var(--font-size-caption)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              Message Body Template
            </label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-default)',
                border: '1px solid var(--color-border)',
                fontFamily: 'monospace',
                fontSize: '13px',
              }}
            />
            {channel === 'SMS' && (
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', textAlign: 'right' }}>
                Character count: {body.length} characters ({Math.ceil(body.length / 160)} SMS segments)
              </div>
            )}
          </div>

          {/* LIVE RENDERED PREVIEW */}
          <Alert variant="info" title="DEMO PREVIEW — Rendered Output">
            <div style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
              {previewRendered}
            </div>
          </Alert>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveTemplate}>
              Save Template
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
