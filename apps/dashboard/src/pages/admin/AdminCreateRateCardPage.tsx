import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Upload,
  Download,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  Layers,
  Sliders,
  Users,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Input,
  Select,
  Modal,
  Alert,
} from '../../components/ui';
import { DEMO_COURIER_PROVIDERS } from '../../mocks/couriers.mock';
import { DEMO_B2B_RATE_CARDS } from '../../mocks/b2bPricing.mock';
import { DEMO_B2C_RATE_CARDS } from '../../mocks/b2cPricing.mock';
import { CustomerRateAssignmentService } from '../../services/customerRateAssignmentService';

export const AdminCreateRateCardPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Steps: 1 = Select Type, 2 = Common Info, 3 = Creation Method, 4 = Upload/Preview
  const [step, setStep] = useState<number>(1);
  const [rateType, setRateType] = useState<'B2B' | 'B2C'>('B2B');

  // Common Info State
  const [cardName, setCardName] = useState('');
  const [courierId, setCourierId] = useState('delhivery');
  const [serviceName, setServiceName] = useState('Freight Surface');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT'>('ACTIVE');
  const [notes, setNotes] = useState('');

  // Creation Method State
  const [creationMethod, setCreationMethod] = useState<'MANUAL' | 'UPLOAD'>('MANUAL');

  // Upload File State & Parsed Data Preview
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [savedSuccessCardId, setSavedSuccessCardId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Template Downloader Helper (CSV / Excel format)
  const handleDownloadTemplate = () => {
    let csvContent = '';
    if (rateType === 'B2B') {
      csvContent = 'Sheet 1: Rate Matrix\nFrom Zone,To Zone,Rate per KG\nN1,N1,5.80\nN1,N2,6.60\nN1,N3,7.00\nN1,N4,8.10\nC1,C1,5.50\nW1,W1,5.20\nS1,S1,5.90\n\nSheet 2: Settings\nMinimum Weight,Divisor,Effective Date\n20,5000,2026-08-25\n\nSheet 3: Additional Charges\nCharge Name,Charge Type,Value,Minimum,Status\nDocket Charge,PER_DOCKET,50,0,ACTIVE\nFuel Surcharge,PERCENTAGE,18,0,ACTIVE\nROV Charge,PERCENTAGE_OF_INVOICE_VALUE,0.2,50,ACTIVE';
    } else {
      csvContent = 'Sheet 1: Rate Info\nRate Card Name,Courier,Service,Effective Date\nDelhivery B2C Standard,Delhivery,Express Surface,2026-08-25\n\nSheet 2: Weight & Zone Rates\nWeight,Zone A Base,Zone A Addl,Zone B Base,Zone B Addl,Zone C1 Base,Zone C1 Addl\n0.5 KG,27,25,29,27,37,35\n1.0 KG,50,45,55,50,70,65\n2.0 KG,90,80,100,90,130,120\n\nSheet 3: Additional Charges\nCharge Name,Charge Type,Value,Status\nFuel Surcharge,PERCENTAGE,15,ACTIVE\nCOD Fee,FIXED,30,ACTIVE';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${rateType}_Rate_Card_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage(`Downloaded ${rateType} Rate Card Excel / CSV Template.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Mock Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setIsImportPreviewOpen(true);
    }
  };

  // Confirm & Save Rate Card Handler
  const handleConfirmSaveCard = () => {
    const courierObj = DEMO_COURIER_PROVIDERS.find((c) => c.id === courierId) || DEMO_COURIER_PROVIDERS[0];
    const generatedId = `${rateType.toLowerCase()}-card-${Date.now()}`;

    if (rateType === 'B2B') {
      const newB2b = {
        id: generatedId,
        name: cardName.trim() || `${courierObj.name} B2B Freight Rate Card`,
        code: `B2B_${generatedId.toUpperCase()}`,
        courierId: courierObj.id,
        courierName: courierObj.name,
        serviceId: `${courierObj.id}-b2b`,
        serviceName: serviceName || `${courierObj.name} B2B Freight`,
        isCustomerSellingCard: true,
        volumetricDivisor: 5000,
        minBillableWeightGrams: 20000, // 20 KG min
        additionalKgRatePaise: 600,
        matrixMap: DEMO_B2B_RATE_CARDS[0].matrixMap,
        weightSlabs: [],
        matrixCells: [],
        surcharges: DEMO_B2B_RATE_CARDS[0].surcharges,
        versions: [{ version: 'v1.0', updatedBy: 'Super Admin', updatedAt: new Date().toLocaleString(), changelog: 'Created rate card' }],
        currency: 'INR' as const,
        version: 'v1.0',
        status: status,
        effectiveFrom: effectiveFrom,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      DEMO_B2B_RATE_CARDS.unshift(newB2b as any);
    } else {
      const newB2c = {
        ...DEMO_B2C_RATE_CARDS[0],
        id: generatedId,
        name: cardName.trim() || `${courierObj.name} B2C Express Rate Card`,
        code: `B2C_${generatedId.toUpperCase()}`,
        courierId: courierObj.id,
        courierName: courierObj.name,
        version: 'v1.0',
        publishedAt: effectiveFrom,
      };
      DEMO_B2C_RATE_CARDS.unshift(newB2c as any);
    }

    setSavedSuccessCardId(generatedId);
    setIsImportPreviewOpen(false);
    setToastMessage(`Rate Card ${cardName || 'New Rate Card'} saved successfully.`);
  };

  const breadcrumbs = [
    { label: 'Super Admin Portal', path: '/admin' },
    { label: 'Rate Cards', path: '/admin/b2b-rates' },
    { label: 'Create Rate Card', path: '/admin/create-rate-card' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* PAGE HEADER */}
      <PageHeader
        title="Create or Upload Rate Card"
        description="Create a new B2B or B2C shipping aggregator selling rate card manually or via Excel template import."
        breadcrumbs={breadcrumbs}
      />

      {toastMessage && (
        <Alert variant="success" title="Rate Card Creation Wizard">
          {toastMessage}
        </Alert>
      )}

      {/* SAVED SUCCESS BANNER */}
      {savedSuccessCardId ? (
        <Card style={{ padding: 'var(--space-6)', textAlign: 'center', backgroundColor: 'var(--color-surface-secondary)', border: '2px solid var(--color-success)' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--color-success)', margin: '0 auto 12px auto' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Rate Card Saved Successfully!</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            Rate card <strong>{cardName || 'New Rate Card'} ({rateType})</strong> is saved and ready for customer assignment.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Button variant="outline" onClick={() => navigate(rateType === 'B2B' ? '/admin/b2b-rates' : '/admin/selling-rates')}>
              View Rate Card
            </Button>
            <Button variant="outline" onClick={() => navigate(rateType === 'B2B' ? '/admin/b2b-rates' : '/admin/selling-rates')}>
              Edit Rate Card
            </Button>
            <Button
              variant="primary"
              leftIcon={<Users size={16} />}
              onClick={() => {
                CustomerRateAssignmentService.assignRateCard({
                  tenantId: 'tenant-demo-01',
                  tenantName: 'Acme Logistics Pvt Ltd',
                  mode: rateType,
                  courierId: courierId,
                  courierName: courierId.toUpperCase(),
                  serviceId: `${courierId}-service`,
                  serviceName: serviceName,
                  rateCardId: savedSuccessCardId,
                  rateCardName: cardName || 'Saved Rate Card',
                  rateCardVersion: 'v1.0',
                  isDefault: true,
                  effectiveFrom: effectiveFrom,
                });
                navigate('/admin/customer-rate-assignments');
              }}
            >
              Assign Customer Now
            </Button>
            <Button variant="ghost" onClick={() => navigate('/admin/all-rate-cards')}>
              Back to Rate Cards
            </Button>
          </div>
        </Card>
      ) : (
        /* WIZARD STEPS */
        <Card style={{ padding: 'var(--space-5)' }}>
          {/* Step Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 1 ? 'var(--color-violet-main)' : 'var(--color-text-muted)' }}>
              <Badge variant={step >= 1 ? 'brand' : 'neutral'}>1</Badge>
              <strong style={{ fontSize: '13px' }}>Rate Type</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 2 ? 'var(--color-violet-main)' : 'var(--color-text-muted)' }}>
              <Badge variant={step >= 2 ? 'brand' : 'neutral'}>2</Badge>
              <strong style={{ fontSize: '13px' }}>Common Info</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 3 ? 'var(--color-violet-main)' : 'var(--color-text-muted)' }}>
              <Badge variant={step >= 3 ? 'brand' : 'neutral'}>3</Badge>
              <strong style={{ fontSize: '13px' }}>Creation Method</strong>
            </div>
          </div>

          {/* STEP 1: RATE TYPE SELECTION */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Select Rate Card Commercial Type</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div
                  onClick={() => setRateType('B2B')}
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-default)',
                    border: rateType === 'B2B' ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                    backgroundColor: rateType === 'B2B' ? 'var(--color-surface)' : 'var(--color-surface-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <Layers size={28} style={{ color: 'var(--color-violet-main)', marginBottom: '12px' }} />
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px', margin: '0 0 6px 0' }}>B2B Freight Cargo</h4>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Starts from 20 KG default minimum weight. Uses 16×16 zone-to-zone matrix pricing and per-KG rates.
                  </p>
                </div>

                <div
                  onClick={() => setRateType('B2C')}
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-default)',
                    border: rateType === 'B2C' ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                    backgroundColor: rateType === 'B2C' ? 'var(--color-surface)' : 'var(--color-surface-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <Sliders size={28} style={{ color: 'var(--color-violet-main)', marginBottom: '12px' }} />
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px', margin: '0 0 6px 0' }}>B2C Express Courier</h4>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Starts from 500 GM. Uses weight slabs (0.5 KG, 1 KG, 2 KG, 5 KG) and zonal base/additional rates.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button variant="primary" rightIcon={<ArrowRight size={14} />} onClick={() => setStep(2)}>
                  Continue to Rate Information
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: COMMON INFO */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Rate Card Information ({rateType})</h3>

              <Input
                label="Rate Card Name *"
                placeholder={`e.g. Delhivery ${rateType} Standard Rate Card 2026`}
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <Select
                  label="Courier Partner *"
                  value={courierId}
                  onChange={(e) => setCourierId(e.target.value)}
                  options={DEMO_COURIER_PROVIDERS.map((c) => ({ value: c.id, label: c.name }))}
                />
                <Input
                  label="Service Mode *"
                  placeholder="e.g. Express Surface Cargo"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
                <Input
                  label="Effective From *"
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
                <Select
                  label="Status *"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  options={[
                    { value: 'ACTIVE', label: 'Active Rate Card' },
                    { value: 'DRAFT', label: 'Draft Mode' },
                  ]}
                />
              </div>

              <Input
                label="Internal Admin Notes (Optional)"
                placeholder="e.g. Rate card assigned to Tier 1 retail merchants."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button variant="primary" rightIcon={<ArrowRight size={14} />} onClick={() => setStep(3)}>
                  Continue to Creation Method
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: CREATION METHOD (MANUAL VS UPLOAD) */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>How do you want to create this rate card?</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div
                  onClick={() => setCreationMethod('MANUAL')}
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-default)',
                    border: creationMethod === 'MANUAL' ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                    backgroundColor: creationMethod === 'MANUAL' ? 'var(--color-surface)' : 'var(--color-surface-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <PlusCircle size={28} style={{ color: 'var(--color-violet-main)', marginBottom: '12px' }} />
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px', margin: '0 0 6px 0' }}>Create Manually</h4>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Enter rates directly into the interactive grid editor and surcharge configuration panel.
                  </p>
                </div>

                <div
                  onClick={() => setCreationMethod('UPLOAD')}
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-default)',
                    border: creationMethod === 'UPLOAD' ? '2px solid var(--color-violet-main)' : '1px solid var(--color-border)',
                    backgroundColor: creationMethod === 'UPLOAD' ? 'var(--color-surface)' : 'var(--color-surface-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <Upload size={28} style={{ color: 'var(--color-violet-main)', marginBottom: '12px' }} />
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px', margin: '0 0 6px 0' }}>Upload Rate Card (Excel / CSV)</h4>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Download template, fill rates in Excel, and upload for automated import preview.
                  </p>
                </div>
              </div>

              {creationMethod === 'UPLOAD' && (
                <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-default)', padding: '24px', textAlign: 'center', backgroundColor: 'var(--color-surface-secondary)', marginTop: '12px' }}>
                  <FileSpreadsheet size={40} style={{ color: 'var(--color-violet-main)', marginBottom: '12px' }} />
                  <h4 style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>Upload {rateType} Rate Card Spreadsheet</h4>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                    Preferred format: <strong>Excel (.xlsx)</strong> or CSV
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <Button variant="outline" leftIcon={<Download size={14} />} onClick={handleDownloadTemplate}>
                      Download {rateType} Excel Template
                    </Button>
                    <label style={{ display: 'inline-block', cursor: 'pointer' }}>
                      <input type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={handleFileUpload} />
                      <Button variant="primary" leftIcon={<Upload size={14} />} style={{ pointerEvents: 'none' }}>
                        Select File to Upload
                      </Button>
                    </label>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Back
                </Button>
                {creationMethod === 'MANUAL' ? (
                  <Button variant="primary" onClick={() => navigate(rateType === 'B2B' ? '/admin/b2b-rates' : '/admin/selling-rates')}>
                    Open Rate Card Editor
                  </Button>
                ) : (
                  <Button variant="primary" disabled={!uploadedFileName} onClick={() => setIsImportPreviewOpen(true)}>
                    Preview Uploaded Rates
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* IMPORT PREVIEW MODAL */}
      {isImportPreviewOpen && (
        <Modal isOpen={isImportPreviewOpen} onClose={() => setIsImportPreviewOpen(false)} title={`Import Preview — ${cardName || 'Uploaded Rate Card'} (${rateType})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Alert variant="info" title="Spreadsheet Parsed Successfully">
              File <strong>{uploadedFileName}</strong> parsed cleanly. Review settings and matrix before confirming.
            </Alert>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', padding: '12px', backgroundColor: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-default)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Rate Type</span>
                <strong>{rateType}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Min Weight</span>
                <strong>{rateType === 'B2B' ? '20 KG Default' : '500 GM Default'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Divisor</span>
                <strong>5000</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Zones Parsed</span>
                <strong>16 Zones (N1..NE2)</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button variant="ghost" onClick={() => setIsImportPreviewOpen(false)}>
                Cancel Import
              </Button>
              <Button variant="primary" onClick={handleConfirmSaveCard}>
                Confirm & Save Rate Card
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
