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
  Modal,
  Input,
} from '../../components/ui';
import { WalletService } from '../../mocks/wallet.mock';
import {
  type WalletTransaction,
  type ShipmentCharge,
} from '../../types/wallet';
import { formatMinorToINR } from '../../utils/moneyFormat';

export const WalletTransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState<WalletTransaction | null>(null);
  const [chargeBreakdown, setChargeBreakdown] = useState<ShipmentCharge | null>(null);

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmountINR, setRefundAmountINR] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('Duplicate freight charge correction');
  const [refundAlert, setRefundAlert] = useState<{ variant: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    const targetId = id || 'tx-102';
    const match = WalletService.getTransactionById(targetId);
    if (match) {
      setTransaction({ ...match });
      setRefundAmountINR(match.amountMinor / 100);
      if (match.referenceType === 'SHIPMENT') {
        const chg = WalletService.getShipmentCharge(match.referenceId);
        setChargeBreakdown(chg);
      }
    } else {
      setTransaction(null);
    }
  }, [id]);

  const handleConfirmRefund = () => {
    if (!transaction) return;
    setRefundAlert(null);

    const res = WalletService.refund(transaction.id, refundAmountINR, refundReason);
    if (res.success && res.transaction) {
      setRefundAlert({
        variant: 'success',
        text: `Refund posted successfully! Added ${formatMinorToINR(res.transaction.amountMinor)} back to wallet.`,
      });
      setIsRefundModalOpen(false);
      const updated = WalletService.getTransactionById(transaction.id);
      if (updated) setTransaction({ ...updated });
    } else {
      setRefundAlert({
        variant: 'danger',
        text: res.message,
      });
    }
  };

  const breadcrumbs = [
    { label: 'Customer Portal', path: '/app' },
    { label: 'Wallet', path: '/app/wallet' },
    { label: 'Transactions', path: '/app/wallet/transactions' },
    { label: transaction?.id || id || 'Detail', path: `/app/wallet/transactions/${id}` },
  ];

  if (!transaction) {
    return (
      <Card style={{ padding: 'var(--space-8)' }}>
        <div>Loading transaction log detail...</div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Page Header */}
      <PageHeader
        title={`Transaction Log #${transaction.id}`}
        description={`${transaction.type} • Reference ${transaction.referenceId} • Posted on ${transaction.createdAt}`}
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => navigate('/app/wallet/transactions')}
            >
              Back to Transactions
            </Button>

            {transaction.direction === 'DEBIT' && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RotateCcw size={16} />}
                onClick={() => setIsRefundModalOpen(true)}
              >
                Post Refund
              </Button>
            )}
          </div>
        }
      />

      {refundAlert && (
        <Alert variant={refundAlert.variant} title="Refund Result">
          {refundAlert.text}
        </Alert>
      )}

      {/* Transaction Overview Card */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
          <div>
            <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', display: 'block' }}>
              Financial Direction & Amount
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: '4px' }}>
              <Badge variant={transaction.direction === 'CREDIT' ? 'success' : 'danger'}>
                {transaction.direction === 'CREDIT' ? '+ CREDIT' : '- DEBIT'}
              </Badge>
              <h2 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'bold', color: transaction.direction === 'CREDIT' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {formatMinorToINR(transaction.amountMinor)}
              </h2>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
            <div>Status: <Badge variant="success">{transaction.status}</Badge></div>
            <div>Timestamp: {transaction.createdAt}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Balance Before Transaction</span>
            <div style={{ fontWeight: 'bold' }}>{formatMinorToINR(transaction.balanceBeforeMinor)}</div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Balance After Transaction</span>
            <div style={{ fontWeight: 'bold', color: 'var(--color-violet-main)' }}>{formatMinorToINR(transaction.balanceAfterMinor)}</div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Reference Type & ID</span>
            <div style={{ fontWeight: 'bold' }}>{transaction.referenceType}: {transaction.referenceId}</div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Double Charge Idempotency Key</span>
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
              {transaction.idempotencyKey}
            </div>
          </div>
        </div>
      </Card>

      {/* CHARGE BREAKDOWN CARD IF SHIPMENT */}
      {chargeBreakdown && (
        <Card style={{ padding: 'var(--space-6)' }}>
          <h4 style={{ fontSize: 'var(--font-size-h4)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
            Shipment Charge Breakdown (Rate Calculator Integration)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', fontSize: 'var(--font-size-small)' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Base Freight Charge</span>
              <strong>{formatMinorToINR(chargeBreakdown.baseFreightMinor)}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Fuel Surcharge</span>
              <strong>{formatMinorToINR(chargeBreakdown.fuelSurchargeMinor)}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>COD Fee</span>
              <strong>{formatMinorToINR(chargeBreakdown.codFeeMinor)}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Tax (18% GST)</span>
              <strong>{formatMinorToINR(chargeBreakdown.taxMinor)}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Total Freight Charge</span>
              <strong style={{ color: 'var(--color-violet-main)', fontSize: 'var(--font-size-body)' }}>
                {formatMinorToINR(chargeBreakdown.totalMinor)}
              </strong>
            </div>
          </div>
        </Card>
      )}

      {/* REFUND MODAL */}
      <Modal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        title="Post Freight Refund"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Alert variant="info" title="Compensating Ledger Refund">
            Posted transactions are immutable. Posting a refund creates a compensating CREDIT transaction back to the merchant wallet.
          </Alert>

          <Input
            label="Refund Amount (INR)"
            type="number"
            value={refundAmountINR}
            onChange={(e) => setRefundAmountINR(Number(e.target.value))}
          />

          <Input
            label="Refund Reason / Notes"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="outline" onClick={() => setIsRefundModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmRefund}>
              Confirm Refund
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
