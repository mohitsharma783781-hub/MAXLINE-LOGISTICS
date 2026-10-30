import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Copy,
  Save,
  Edit2,
  Eye,
  Sliders,
  History,
  Trash2,
  RefreshCw,
  Calculator,
  ShieldAlert,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  TrendingUp,
  Download,
  Check,
  AlertCircle,
  Layers,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Button,
  Card,
  Badge,
  Table,
  Input,
  Select,
  Alert,
  Modal,
  ConfirmationDialog,
} from '../../components/ui';
import { B2B_ZONES } from '../../types/b2bPricing';
import {
  AdminB2BRateService,
  B2BRateCard,
  B2BRateCardAuditLog,
  B2BSurcharge,
  B2BRateCalculationResult,
} from '../../services/adminB2BRateService';
import {
  parseExcelWorkbook,
  WorkbookParseResult,
  ParsedSheetRateCard,
} from '../../utils/excelRateCardParser';

const AVAILABLE_COURIERS = [
  { id: 'delhivery', name: 'Delhivery Surface & Express', defaultService: 'Surface Freight Cargo' },
  { id: 'bluedart', name: 'Blue Dart Express', defaultService: 'Priority Air Cargo' },
  { id: 'dtdc', name: 'DTDC Express Ltd', defaultService: 'Express Cargo Freight' },
  { id: 'xpressbees', name: 'XpressBees Logistics', defaultService: 'B2B Heavy Surface' },
  { id: 'gati', name: 'Gati KWE Express', defaultService: 'Commercial Surface Cargo' },
];

export const AdminB2BRateCardsPage: React.FC = () => {
  const navigate = useNavigate();

  // Rate Cards State
  const [cardsList, setCardsList] = useState<B2BRateCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Active View & Filter Controls
  const [activeViewMode, setActiveViewMode] = useState<'LIST' | 'CREATE_B2B' | 'EDIT_B2B' | 'VIEW'>('LIST');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'DRAFT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Card for Viewing / Editing / History / Test
  const [editingCard, setEditingCard] = useState<B2BRateCard | null>(null);
  const [viewingCard, setViewingCard] = useState<B2BRateCard | null>(null);

  // FORM FIELDS
  const [formName, setFormName] = useState('');
  const [formCourierId, setFormCourierId] = useState('delhivery');
  const [formServiceName, setFormServiceName] = useState('Surface Freight Cargo');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE' | 'DRAFT'>('ACTIVE');
  const [formEffectiveFrom, setFormEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [formEffectiveTo, setFormEffectiveTo] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formChangelog, setFormChangelog] = useState('');

  // Commercial Rules Configuration
  const [formVolumetricDivisor, setFormVolumetricDivisor] = useState('5000');
  const [formMinChargeableWeightKg, setFormMinChargeableWeightKg] = useState('20');
  const [formMinFreightChargeINR, setFormMinFreightChargeINR] = useState('350');
  const [formWeightRoundingRule, setFormWeightRoundingRule] = useState<'ROUND_UP_1KG' | 'ROUND_UP_500G' | 'EXACT' | 'CEIL'>('ROUND_UP_1KG');
  const [formFuelSurchargePct, setFormFuelSurchargePct] = useState('18');
  const [formDocketChargeINR, setFormDocketChargeINR] = useState('50');
  const [formGstPercent, setFormGstPercent] = useState('18');

  // 16x16 Zone Matrix State (Origin -> Dest -> Rate in INR/kg string)
  const [matrixState, setMatrixState] = useState<Record<string, Record<string, string>>>(() => {
    const map: Record<string, Record<string, string>> = {};
    B2B_ZONES.forEach((oz) => {
      map[oz] = {};
      B2B_ZONES.forEach((dz) => {
        map[oz][dz] = '7.00';
      });
    });
    return map;
  });
  const [bulkFillVal, setBulkFillVal] = useState('7.00');

  // Surcharges Configuration
  const [surchargesList, setSurchargesList] = useState<B2BSurcharge[]>([
    { id: 's1', code: 'DOCKET', name: 'Docket Charge', calcType: 'FIXED', value: 5000, status: 'ACTIVE' },
    { id: 's2', code: 'FUEL', name: 'Fuel Surcharge', calcType: 'PERCENTAGE', value: 18, status: 'ACTIVE' },
    { id: 's3', code: 'ODA', name: 'Out of Delivery Area (ODA)', calcType: 'FIXED', value: 50000, minAmountMinor: 25000, status: 'ACTIVE' },
    { id: 's4', code: 'ROV', name: 'Risk of Vulnerability (ROV)', calcType: 'PERCENTAGE', value: 0.2, minAmountMinor: 5000, status: 'ACTIVE' },
  ]);

  // Modal Dialogs State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [auditLogsList, setAuditLogsList] = useState<B2BRateCardAuditLog[]>([]);
  const [isAuditLogsLoading, setIsAuditLogsLoading] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<B2BRateCard | null>(null);

  // EXCEL UPLOAD & MULTI-SHEET PREVIEW MODAL STATE
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [workbookResult, setWorkbookResult] = useState<WorkbookParseResult | null>(null);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [activeSheetTab, setActiveSheetTab] = useState<'MATRIX' | 'CHARGES' | 'COVERAGE'>('MATRIX');
  const [isImportingSheets, setIsImportingSheets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ACTIVATE DRAFT CONFIRMATION STATE
  const [isActivateConfirmOpen, setIsActivateConfirmOpen] = useState(false);
  const [cardToActivate, setCardToActivate] = useState<B2BRateCard | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // MERCHANT PRICING & MARKUP CONFIGURATION MODAL STATE
  const [isMarkupModalOpen, setIsMarkupModalOpen] = useState(false);
  const [cardForMarkup, setCardForMarkup] = useState<B2BRateCard | null>(null);
  const [markupType, setMarkupType] = useState<'NONE' | 'PERCENTAGE' | 'FIXED_PER_KG' | 'FIXED_PER_DOCKET'>('PERCENTAGE');
  const [markupValue, setMarkupValue] = useState('15');
  const [markupCardType, setMarkupCardType] = useState('BASE_COST');
  const [isSavingMarkup, setIsSavingMarkup] = useState(false);

  // Rate Engine Live Test Modal
  const [isTestCalculatorOpen, setIsTestCalculatorOpen] = useState(false);
  const [testOriginPin, setTestOriginPin] = useState('110001');
  const [testDestPin, setTestDestPin] = useState('560001');
  const [testDeadWeightKg, setTestDeadWeightKg] = useState('25');
  const [testLengthCm, setTestLengthCm] = useState('40');
  const [testWidthCm, setTestWidthCm] = useState('30');
  const [testHeightCm, setTestHeightCm] = useState('30');
  const [testBoxQty, setTestBoxQty] = useState('2');
  const [testInvoiceValueINR, setTestInvoiceValueINR] = useState('10000');
  const [testResult, setTestResult] = useState<B2BRateCalculationResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Toast / Status Message
  const [toastMessage, setToastMessage] = useState<{ text: string; variant: 'success' | 'danger' | 'info' } | null>(null);
  const showToast = (text: string, variant: 'success' | 'danger' | 'info' = 'success') => {
    setToastMessage({ text, variant });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // FETCH RATE CARDS FROM BACKEND
  const loadRateCards = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const cards = await AdminB2BRateService.listRateCards();
      setCardsList(cards);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load B2B Rate Cards from Supabase.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRateCards();
  }, [loadRateCards]);

  // Bulk fill matrix helper
  const handleBulkFillMatrix = () => {
    const rate = parseFloat(bulkFillVal) || 7.0;
    const newMap: Record<string, Record<string, string>> = {};
    B2B_ZONES.forEach((oz) => {
      newMap[oz] = {};
      B2B_ZONES.forEach((dz) => {
        newMap[oz][dz] = rate.toFixed(2);
      });
    });
    setMatrixState(newMap);
    showToast(`Updated all 256 matrix cells to ₹${rate.toFixed(2)}/KG.`, 'info');
  };

  const handleMatrixCellChange = (oz: string, dz: string, val: string) => {
    setMatrixState((prev) => ({
      ...prev,
      [oz]: {
        ...prev[oz],
        [dz]: val,
      },
    }));
  };

  // OPEN CREATE FORM
  const handleOpenCreateForm = () => {
    setEditingCard(null);
    setFormName('');
    setFormCourierId('delhivery');
    setFormServiceName('Surface Freight Cargo');
    setFormStatus('ACTIVE');
    setFormEffectiveFrom(new Date().toISOString().split('T')[0]);
    setFormEffectiveTo('');
    setFormDescription('');
    setFormChangelog('Initial rate card creation.');
    setFormVolumetricDivisor('5000');
    setFormMinChargeableWeightKg('20');
    setFormMinFreightChargeINR('350');
    setFormWeightRoundingRule('ROUND_UP_1KG');
    setFormFuelSurchargePct('18');
    setFormDocketChargeINR('50');
    setFormGstPercent('18');

    // Default matrix
    const newMap: Record<string, Record<string, string>> = {};
    B2B_ZONES.forEach((oz) => {
      newMap[oz] = {};
      B2B_ZONES.forEach((dz) => {
        newMap[oz][dz] = '7.00';
      });
    });
    setMatrixState(newMap);

    setActiveViewMode('CREATE_B2B');
  };

  // OPEN EDIT FORM
  const handleOpenEditForm = (card: B2BRateCard) => {
    setEditingCard(card);
    setFormName(card.name);
    setFormCourierId(card.courier_id);
    setFormServiceName(card.service_name || 'Surface Freight Cargo');
    setFormStatus(card.status);
    setFormEffectiveFrom(card.effective_from ? card.effective_from.split('T')[0] : new Date().toISOString().split('T')[0]);
    setFormEffectiveTo(card.effective_to ? card.effective_to.split('T')[0] : '');
    setFormDescription(card.description || '');
    setFormChangelog('');
    setFormVolumetricDivisor(String(card.volumetric_divisor || 5000));
    setFormMinChargeableWeightKg(String(Math.round((card.min_chargeable_weight_grams || 20000) / 1000)));
    setFormMinFreightChargeINR(String(Math.round((card.min_freight_charge_minor || 0) / 100)));
    setFormWeightRoundingRule(card.weight_rounding_rule as any || 'ROUND_UP_1KG');
    setFormFuelSurchargePct(String(card.fuel_surcharge_percent || 0));
    setFormDocketChargeINR(String(Math.round((card.docket_charge_minor || 0) / 100)));
    setFormGstPercent(String(card.gst_percent || 18));

    // Populate matrix from card.zone_matrix
    const newMap: Record<string, Record<string, string>> = {};
    const existingMatrix = (card.zone_matrix || {}) as Record<string, Record<string, number>>;
    B2B_ZONES.forEach((oz) => {
      newMap[oz] = {};
      B2B_ZONES.forEach((dz) => {
        const paiseVal = existingMatrix[oz]?.[dz];
        newMap[oz][dz] = paiseVal !== undefined ? (paiseVal / 100).toFixed(2) : '7.00';
      });
    });
    setMatrixState(newMap);

    if (card.surcharges && Array.isArray(card.surcharges)) {
      setSurchargesList(card.surcharges);
    }

    setActiveViewMode('EDIT_B2B');
  };

  // OPEN DUPLICATE
  const handleOpenDuplicate = (card: B2BRateCard) => {
    setEditingCard(null);
    setFormName(`${card.name} (Copy)`);
    setFormCourierId(card.courier_id);
    setFormServiceName(card.service_name);
    setFormStatus('DRAFT');
    setFormEffectiveFrom(new Date().toISOString().split('T')[0]);
    setFormEffectiveTo('');
    setFormDescription(`Duplicated from ${card.name} (v${card.version})`);
    setFormChangelog(`Duplicated from ${card.name}.`);
    setFormVolumetricDivisor(String(card.volumetric_divisor || 5000));
    setFormMinChargeableWeightKg(String(Math.round((card.min_chargeable_weight_grams || 20000) / 1000)));
    setFormMinFreightChargeINR(String(Math.round((card.min_freight_charge_minor || 0) / 100)));
    setFormWeightRoundingRule(card.weight_rounding_rule as any || 'ROUND_UP_1KG');
    setFormFuelSurchargePct(String(card.fuel_surcharge_percent || 0));
    setFormDocketChargeINR(String(Math.round((card.docket_charge_minor || 0) / 100)));
    setFormGstPercent(String(card.gst_percent || 18));

    const newMap: Record<string, Record<string, string>> = {};
    const existingMatrix = (card.zone_matrix || {}) as Record<string, Record<string, number>>;
    B2B_ZONES.forEach((oz) => {
      newMap[oz] = {};
      B2B_ZONES.forEach((dz) => {
        const paiseVal = existingMatrix[oz]?.[dz];
        newMap[oz][dz] = paiseVal !== undefined ? (paiseVal / 100).toFixed(2) : '7.00';
      });
    });
    setMatrixState(newMap);
    setActiveViewMode('CREATE_B2B');
  };

  // SAVE SUBMIT (CREATE OR UPDATE)
  const handleSaveRateCardSubmit = async () => {
    if (!formName.trim()) {
      showToast('Please enter a Rate Card Name.', 'danger');
      return;
    }

    const courierObj = AVAILABLE_COURIERS.find((c) => c.id === formCourierId) || AVAILABLE_COURIERS[0];

    // Build zone matrix in paise
    const zoneMatrixPaise: Record<string, Record<string, number>> = {};
    B2B_ZONES.forEach((oz) => {
      zoneMatrixPaise[oz] = {};
      B2B_ZONES.forEach((dz) => {
        const valINR = parseFloat(matrixState[oz]?.[dz]) || 7.0;
        zoneMatrixPaise[oz][dz] = Math.round(valINR * 100);
      });
    });

    const payload: Partial<B2BRateCard> & { changelog?: string } = {
      name: formName.trim(),
      courier_id: courierObj.id,
      courier_name: courierObj.name,
      service_id: `${courierObj.id}-surface-b2b`,
      service_name: formServiceName.trim() || courierObj.defaultService,
      mode: 'B2B',
      status: formStatus,
      effective_from: new Date(formEffectiveFrom).toISOString(),
      effective_to: formEffectiveTo ? new Date(formEffectiveTo).toISOString() : null,
      volumetric_divisor: parseInt(formVolumetricDivisor) || 5000,
      min_chargeable_weight_grams: Math.round((parseFloat(formMinChargeableWeightKg) || 20) * 1000),
      min_freight_charge_minor: Math.round((parseFloat(formMinFreightChargeINR) || 0) * 100),
      weight_rounding_rule: formWeightRoundingRule,
      fuel_surcharge_percent: parseFloat(formFuelSurchargePct) || 0,
      docket_charge_minor: Math.round((parseFloat(formDocketChargeINR) || 0) * 100),
      gst_percent: parseFloat(formGstPercent) || 18,
      zone_matrix: zoneMatrixPaise,
      surcharges: surchargesList,
      description: formDescription.trim(),
      changelog: formChangelog.trim() || undefined,
    };

    try {
      if (editingCard) {
        const updated = await AdminB2BRateService.updateRateCard(editingCard.id, payload);
        showToast(`Rate Card "${updated.name}" updated successfully (Bumped to v${updated.version}).`, 'success');
      } else {
        const created = await AdminB2BRateService.createRateCard(payload);
        showToast(`Created B2B Rate Card "${created.name}" (v${created.version}) successfully.`, 'success');
      }
      setActiveViewMode('LIST');
      await loadRateCards();
    } catch (err: any) {
      showToast(err.message || 'Failed to save Rate Card to Supabase.', 'danger');
    }
  };

  // TOGGLE STATUS HANDLER
  const handleToggleStatus = async (card: B2BRateCard) => {
    const nextStatus = card.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await AdminB2BRateService.toggleStatus(card.id, nextStatus, `Status switched to ${nextStatus} by Admin.`);
      showToast(`Rate Card "${card.name}" is now ${nextStatus}.`, 'success');
      await loadRateCards();
    } catch (err: any) {
      showToast(err.message || 'Failed to update rate card status.', 'danger');
    }
  };

  // DELETE HANDLER
  const handleConfirmDelete = async () => {
    if (!cardToDelete) return;
    try {
      await AdminB2BRateService.deleteRateCard(cardToDelete.id);
      showToast(`Deleted Rate Card "${cardToDelete.name}".`, 'info');
      setIsDeleteModalOpen(false);
      setCardToDelete(null);
      await loadRateCards();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete Rate Card.', 'danger');
    }
  };

  // VIEW AUDIT LOGS
  const handleOpenAuditLogs = async (card: B2BRateCard) => {
    setViewingCard(card);
    setIsHistoryModalOpen(true);
    setIsAuditLogsLoading(true);
    try {
      const logs = await AdminB2BRateService.getAuditLogs(card.id);
      setAuditLogsList(logs);
    } catch (err: any) {
      showToast(err.message || 'Failed to load audit history.', 'danger');
    } finally {
      setIsAuditLogsLoading(false);
    }
  };

  // EXECUTE LIVE RATE TEST VIA PRICING ENGINE
  const handleRunPricingTest = async (card?: B2BRateCard) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await AdminB2BRateService.calculateB2BRate({
        courierId: card ? card.courier_id : editingCard?.courier_id || formCourierId,
        rateCardId: card ? card.id : editingCard?.id,
        originPincode: testOriginPin,
        destinationPincode: testDestPin,
        deadWeightKg: parseFloat(testDeadWeightKg) || 20,
        boxes: [
          {
            lengthCm: parseFloat(testLengthCm) || 40,
            widthCm: parseFloat(testWidthCm) || 30,
            heightCm: parseFloat(testHeightCm) || 30,
            quantity: parseInt(testBoxQty) || 1,
          },
        ],
        invoiceValueMinor: Math.round((parseFloat(testInvoiceValueINR) || 0) * 100),
      });
      setTestResult(result);
    } catch (err: any) {
      showToast(err.message || 'Pricing engine test execution failed.', 'danger');
    } finally {
      setIsTesting(false);
    }
  };

  // EXCEL FILE HANDLERS
  const handleExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsingExcel(true);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelWorkbook(buffer, file.name);
      setWorkbookResult(result);
      setSelectedSheetIndex(0);
      setActiveSheetTab('MATRIX');
      showToast(`Successfully parsed "${file.name}": Detected ${result.sheets.length} courier sheet(s).`, 'success');
    } catch (err: any) {
      showToast(`Failed to parse Excel workbook: ${err.message || String(err)}`, 'danger');
    } finally {
      setIsParsingExcel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdateMatrixCellInParsedSheet = (oz: string, dz: string, val: string) => {
    if (!workbookResult) return;
    const num = parseFloat(val);
    if (isNaN(num)) return;
    const updatedSheets = [...workbookResult.sheets];
    const targetSheet = { ...updatedSheets[selectedSheetIndex] };
    targetSheet.zoneMatrix = {
      ...targetSheet.zoneMatrix,
      [oz]: {
        ...(targetSheet.zoneMatrix[oz] || {}),
        [dz]: Math.round(num * 100),
      },
    };
    updatedSheets[selectedSheetIndex] = targetSheet;
    setWorkbookResult({ ...workbookResult, sheets: updatedSheets });
  };

  const handleImportSingleSheet = async (sheet: ParsedSheetRateCard) => {
    setIsImportingSheets(true);
    try {
      await AdminB2BRateService.bulkImportDrafts([sheet], false);
      showToast(`Rate card for "${sheet.courierName}" imported successfully in DRAFT status!`, 'success');
      await loadRateCards();
      setIsExcelModalOpen(false);
      setWorkbookResult(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to import rate card.', 'danger');
    } finally {
      setIsImportingSheets(false);
    }
  };

  const handleImportAllSheets = async () => {
    if (!workbookResult || workbookResult.sheets.length === 0) return;
    setIsImportingSheets(true);
    try {
      await AdminB2BRateService.bulkImportDrafts(workbookResult.sheets, false);
      showToast(`All ${workbookResult.sheets.length} courier sheets imported successfully in DRAFT status!`, 'success');
      await loadRateCards();
      setIsExcelModalOpen(false);
      setWorkbookResult(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to import rate cards.', 'danger');
    } finally {
      setIsImportingSheets(false);
    }
  };

  const handleOpenActivateDialog = (card: B2BRateCard) => {
    setCardToActivate(card);
    setIsActivateConfirmOpen(true);
  };

  const handleConfirmActivate = async () => {
    if (!cardToActivate) return;
    setIsActivating(true);
    try {
      await AdminB2BRateService.activateRateCard(cardToActivate.id);
      showToast(`Rate Card "${cardToActivate.name}" has been APPROVED & ACTIVATED! Any prior active cards safely archived.`, 'success');
      setIsActivateConfirmOpen(false);
      setCardToActivate(null);
      await loadRateCards();
    } catch (err: any) {
      showToast(err.message || 'Failed to activate rate card.', 'danger');
    } finally {
      setIsActivating(false);
    }
  };

  const handleOpenMarkupModal = (card: B2BRateCard) => {
    setCardForMarkup(card);
    setMarkupType((card.markup_type as any) || 'PERCENTAGE');
    setMarkupValue(String(card.markup_value || '15'));
    setMarkupCardType(card.card_type || 'BASE_COST');
    setIsMarkupModalOpen(true);
  };

  const handleSaveMarkup = async () => {
    if (!cardForMarkup) return;
    setIsSavingMarkup(true);
    try {
      await AdminB2BRateService.updateMarkup(cardForMarkup.id, {
        markup_type: markupType,
        markup_value: parseFloat(markupValue) || 0,
        card_type: markupCardType,
      });
      showToast(`Merchant markup updated successfully for "${cardForMarkup.name}".`, 'success');
      setIsMarkupModalOpen(false);
      setCardForMarkup(null);
      await loadRateCards();
    } catch (err: any) {
      showToast(err.message || 'Failed to update markup.', 'danger');
    } finally {
      setIsSavingMarkup(false);
    }
  };

  const handleRollback = async (rateCardId: string) => {
    try {
      await AdminB2BRateService.rollbackRateCard(rateCardId);
      showToast('Successfully rolled back to this rate card version!', 'success');
      if (viewingCard) {
        const updated = await AdminB2BRateService.getRateCard(viewingCard.id);
        setViewingCard(updated);
        const logs = await AdminB2BRateService.getAuditLogs(viewingCard.id);
        setAuditLogsList(logs);
      }
      await loadRateCards();
    } catch (err: any) {
      showToast(err.message || 'Failed to rollback rate card.', 'danger');
    }
  };

  // FILTERED CARDS LIST
  const filteredCards = cardsList.filter((c) => {
    if (activeStatusFilter !== 'ALL' && c.status !== activeStatusFilter) return false;
    if (
      searchQuery.trim() &&
      !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.courier_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.service_name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const breadcrumbs = [
    { label: 'Platform Admin', path: '/admin' },
    { label: 'Pricing & Rates', path: '/admin/b2b-rates' },
    { label: 'B2B Rate Management', path: '/admin/b2b-rates' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* PAGE HEADER */}
      <PageHeader
        title="Admin B2B Rate Management"
        description="Authoritative database configuration for courier B2B commercial cargo rate cards, 16×16 zone matrices, volumetric divisors, minimum weights, fuel surcharges, and GST rules."
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="outline" size="sm" leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />} onClick={loadRateCards}>
              Sync Rates
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload size={14} />}
              onClick={() => setIsExcelModalOpen(true)}
              style={{ borderColor: 'var(--color-violet-main)', color: 'var(--color-violet-main)' }}
            >
              Upload Excel Rate Cards (.xlsx)
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Sliders size={14} />} onClick={() => navigate('/admin/selling-rates')}>
              B2C Rate Cards
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Calculator size={14} />} onClick={() => { setIsTestCalculatorOpen(true); handleRunPricingTest(); }}>
              Test Pricing Engine
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={handleOpenCreateForm}>
              + Create B2B Rate Card
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleExcelFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        }
      />

      {toastMessage && (
        <Alert variant={toastMessage.variant} title="B2B Pricing Engine Notification">
          {toastMessage.text}
        </Alert>
      )}

      {fetchError && (
        <Alert variant="danger" title="Database Connection Notice">
          {fetchError}
        </Alert>
      )}

      {/* VIEW MODE: LIST */}
      {activeViewMode === 'LIST' && (
        <>
          {/* FILTER TABS & SEARCH */}
          <Card style={{ padding: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--color-surface-secondary)', padding: '4px', borderRadius: 'var(--radius-default)' }}>
                {(['ALL', 'ACTIVE', 'INACTIVE', 'DRAFT'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveStatusFilter(tab)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      backgroundColor: activeStatusFilter === tab ? 'var(--color-violet-main)' : 'transparent',
                      color: activeStatusFilter === tab ? '#ffffff' : 'var(--color-text-secondary)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Input
                  placeholder="Search rate card, courier, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ minWidth: '260px' }}
                />
              </div>
            </div>
          </Card>

          {/* RATE CARDS TABLE OR EMPTY STATE */}
          <Card style={{ padding: 'var(--space-4)' }}>
            {isLoading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'var(--color-violet-main)' }} />
                <p style={{ margin: 0, fontWeight: 500 }}>Connecting to Supabase and loading B2B rate cards...</p>
              </div>
            ) : filteredCards.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#0f172a' }}>
                    No B2B Commercial Rate Cards Configured
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '580px', margin: 0, lineHeight: 1.5 }}>
                    There are currently no commercial rate cards configured in the database. Rate cards defined here authoritatively control volumetric divisors, 16×16 zone freight matrices, minimum weights (20 KG+), docket charges, fuel surcharges, and GST. Sellers will receive a clear <code>RATE_NOT_CONFIGURED</code> status until you configure an active card.
                  </p>
                </div>
                <Button variant="primary" leftIcon={<Plus size={16} />} onClick={handleOpenCreateForm}>
                  Configure First B2B Rate Card
                </Button>
              </div>
            ) : (
              <Table<B2BRateCard>
                keyExtractor={(c) => c.id}
                columns={[
                  {
                    key: 'name',
                    header: 'Rate Card Details',
                    render: (c) => (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: 'var(--color-violet-main)', fontSize: '14px' }}>{c.name || 'B2B Commercial Rate Card'}</strong>
                          <Badge variant="neutral">v{c.version || 1}</Badge>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {c.service_name || 'Surface Cargo'} • ID: {c.id ? c.id.slice(0, 12) : 'B2B'}...
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'courier_name',
                    header: 'Courier Partner',
                    render: (c) => (
                      <div>
                        <strong style={{ color: '#1e293b' }}>{c.courier_name || (c as any).courierName || 'Commercial Partner'}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Code: {String(c.courier_id || (c as any).courierId || 'B2B').toUpperCase()}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'volumetric_divisor',
                    header: 'Divisor & Min Wt',
                    render: (c) => (
                      <div>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>/{c.volumetric_divisor || 5000}</span>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Min: {Math.round((c.min_chargeable_weight_grams || 20000) / 1000)} KG
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'pricing_rules',
                    header: 'Freight & Surcharges',
                    render: (c) => (
                      <div>
                        <span style={{ fontSize: '12px' }}>Min: ₹{((c.min_freight_charge_minor || 0) / 100).toFixed(0)}</span>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Fuel: {c.fuel_surcharge_percent || 0}% • Docket: ₹{((c.docket_charge_minor || 0) / 100).toFixed(0)}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'rounding',
                    header: 'Rounding & GST',
                    render: (c) => (
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>{c.weight_rounding_rule}</span>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>GST: {c.gst_percent}%</div>
                      </div>
                    ),
                  },
                  {
                    key: 'markup',
                    header: 'Merchant Pricing / Markup',
                    render: (c) => {
                      const hasMarkup = c.markup_type && c.markup_type !== 'NONE' && Number(c.markup_value || 0) > 0;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Badge variant={c.card_type === 'SELLER_SELLING' ? 'brand' : 'neutral'}>
                              {c.card_type === 'SELLER_SELLING' ? 'Selling Price' : 'Base Cost'}
                            </Badge>
                            {hasMarkup ? (
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a' }}>
                                +{c.markup_value}{c.markup_type === 'PERCENTAGE' ? '%' : '/kg'}
                              </span>
                            ) : (
                              <span style={{ fontSize: '10px', color: '#94a3b8' }}>No Markup</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleOpenMarkupModal(c)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-violet-main)',
                              fontSize: '11px',
                              cursor: 'pointer',
                              padding: 0,
                              textAlign: 'left',
                              textDecoration: 'underline',
                              fontWeight: 500,
                            }}
                          >
                            Set Markup Margin
                          </button>
                        </div>
                      );
                    },
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (c) => (
                      <button
                        onClick={() => handleToggleStatus(c)}
                        title="Click to toggle status"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <Badge variant={c.status === 'ACTIVE' ? 'success' : c.status === 'DRAFT' ? 'warning' : 'danger'}>
                          {c.status}
                        </Badge>
                      </button>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    align: 'right',
                    render: (c) => (
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {(c.status === 'DRAFT' || !c.is_active) && (
                          <Button
                            variant="primary"
                            size="sm"
                            title="Approve & Activate this Rate Card into Live Pricing Engine"
                            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: '#ffffff', fontWeight: 600, padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => handleOpenActivateDialog(c)}
                          >
                            <CheckCircle size={12} style={{ marginRight: '4px' }} />
                            Approve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Merchant Pricing & Margin"
                          onClick={() => handleOpenMarkupModal(c)}
                        >
                          <TrendingUp size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View rate card summary"
                          onClick={() => {
                            setViewingCard(c);
                            setActiveViewMode('VIEW');
                          }}
                        >
                          <Eye size={13} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Edit rate configuration"
                          onClick={() => handleOpenEditForm(c)}
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Duplicate as new rate card"
                          onClick={() => handleOpenDuplicate(c)}
                        >
                          <Copy size={13} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="View version audit history"
                          onClick={() => handleOpenAuditLogs(c)}
                        >
                          <History size={13} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Test route pricing"
                          onClick={() => {
                            setEditingCard(c);
                            setIsTestCalculatorOpen(true);
                            handleRunPricingTest(c);
                          }}
                        >
                          <Calculator size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete rate card"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => {
                            setCardToDelete(c);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={filteredCards}
              />
            )}
          </Card>
        </>
      )}

      {/* VIEW MODE: CREATE OR EDIT B2B RATE CARD FORM */}
      {(activeViewMode === 'CREATE_B2B' || activeViewMode === 'EDIT_B2B') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--color-violet-main)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                  {activeViewMode === 'CREATE_B2B' ? 'Create B2B Commercial Rate Card' : `Edit Rate Card — ${editingCard?.name} (v${editingCard?.version})`}
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Platform Admin only: Configure courier partners, volumetric divisor, minimum weight rules, 16×16 zone matrix, surcharges, and GST.
                </span>
              </div>
              <Button variant="ghost" onClick={() => setActiveViewMode('LIST')}>
                Back to Rate Cards
              </Button>
            </div>
          </Card>

          {/* SECTION A — RATE CARD IDENTIFICATION */}
          <Card style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
              SECTION A — Rate Card Identification & Courier
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              <Input
                label="Rate Card Name *"
                placeholder="e.g. Delhivery Heavy Cargo Surface B2B"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />

              <Select
                label="Courier Partner *"
                value={formCourierId}
                onChange={(e) => {
                  setFormCourierId(e.target.value);
                  const found = AVAILABLE_COURIERS.find((c) => c.id === e.target.value);
                  if (found) setFormServiceName(found.defaultService);
                }}
                options={AVAILABLE_COURIERS.map((c) => ({ value: c.id, label: c.name }))}
              />

              <Input
                label="Service Name *"
                placeholder="e.g. Surface Freight Cargo"
                value={formServiceName}
                onChange={(e) => setFormServiceName(e.target.value)}
              />

              <Select
                label="Status *"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                options={[
                  { value: 'ACTIVE', label: 'ACTIVE' },
                  { value: 'DRAFT', label: 'DRAFT' },
                  { value: 'INACTIVE', label: 'INACTIVE' },
                ]}
              />

              <Input
                label="Effective From *"
                type="date"
                value={formEffectiveFrom}
                onChange={(e) => setFormEffectiveFrom(e.target.value)}
              />

              <Input
                label="Effective To (Optional)"
                type="date"
                value={formEffectiveTo}
                onChange={(e) => setFormEffectiveTo(e.target.value)}
              />
            </div>

            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Input
                label="Rate Card Description / Remarks"
                placeholder="e.g. Negotiated pan-India B2B surface cargo rate card"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
              <Input
                label="Changelog Note (Saved in Audit History)"
                placeholder="e.g. Bumped N1->N2 rate from 6.80 to 7.00/kg"
                value={formChangelog}
                onChange={(e) => setFormChangelog(e.target.value)}
              />
            </div>
          </Card>

          {/* SECTION B — AUTHORITATIVE PRICING RULES (ADMIN ONLY) */}
          <Card style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ShieldAlert size={18} style={{ color: 'var(--color-violet-main)' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>
                SECTION B — Commercial Calculation Rules (Protected Admin Configuration)
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
              These parameters are enforced by the server-side pricing engine. Sellers cannot alter or view divisor logic.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
              <Input
                label="Volumetric Divisor (cm³/kg) *"
                type="number"
                value={formVolumetricDivisor}
                onChange={(e) => setFormVolumetricDivisor(e.target.value)}
              />

              <Input
                label="Min Chargeable Weight (KG) *"
                type="number"
                value={formMinChargeableWeightKg}
                onChange={(e) => setFormMinChargeableWeightKg(e.target.value)}
              />

              <Input
                label="Min Freight Charge (₹) *"
                type="number"
                value={formMinFreightChargeINR}
                onChange={(e) => setFormMinFreightChargeINR(e.target.value)}
              />

              <Select
                label="Weight Rounding Rule *"
                value={formWeightRoundingRule}
                onChange={(e) => setFormWeightRoundingRule(e.target.value as any)}
                options={[
                  { value: 'ROUND_UP_1KG', label: 'Round Up to Next 1 KG (e.g. 21.2 → 22 KG)' },
                  { value: 'ROUND_UP_500G', label: 'Round Up to Next 500g (e.g. 21.2 → 21.5 KG)' },
                  { value: 'CEIL', label: 'Ceil (Standard Integer)' },
                  { value: 'EXACT', label: 'Exact Weight (Decimal)' },
                ]}
              />

              <Input
                label="Fuel Surcharge (%) *"
                type="number"
                value={formFuelSurchargePct}
                onChange={(e) => setFormFuelSurchargePct(e.target.value)}
              />

              <Input
                label="Docket Charge (₹) *"
                type="number"
                value={formDocketChargeINR}
                onChange={(e) => setFormDocketChargeINR(e.target.value)}
              />

              <Input
                label="GST Rate (%) *"
                type="number"
                value={formGstPercent}
                onChange={(e) => setFormGstPercent(e.target.value)}
              />
            </div>
          </Card>

          {/* SECTION C — 16x16 ZONE RATE MATRIX */}
          <Card style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>
                  SECTION C — 16×16 Zone Rate Matrix (₹ per KG)
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Rows = Origin Zone • Columns = Destination Zone. Rates stored authoritatively in paise per KG.
                </span>
              </div>

              {/* Bulk Fill Tool */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Set All Cells:</span>
                <input
                  type="number"
                  step="0.10"
                  value={bulkFillVal}
                  onChange={(e) => setBulkFillVal(e.target.value)}
                  style={{ width: '70px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
                <Button variant="outline" size="sm" onClick={handleBulkFillMatrix}>
                  Fill All
                </Button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '520px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-default)', marginTop: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface-secondary)', zIndex: 3, borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: '8px', textAlign: 'left', minWidth: '80px', position: 'sticky', left: 0, backgroundColor: 'var(--color-surface-secondary)', zIndex: 4 }}>
                      From \ To
                    </th>
                    {B2B_ZONES.map((dz) => (
                      <th key={dz} style={{ padding: '8px', textAlign: 'center', minWidth: '60px', color: 'var(--color-violet-main)', fontWeight: 'bold' }}>
                        {dz}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {B2B_ZONES.map((oz) => (
                    <tr key={oz} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: 'var(--color-surface)', zIndex: 2, borderRight: '1px solid var(--color-border)' }}>
                        {oz}
                      </td>
                      {B2B_ZONES.map((dz) => {
                        const currentVal = matrixState[oz]?.[dz] || '7.00';
                        return (
                          <td key={dz} style={{ padding: '4px', textAlign: 'center' }}>
                            <input
                              type="number"
                              step="0.10"
                              value={currentVal}
                              onChange={(e) => handleMatrixCellChange(oz, dz, e.target.value)}
                              style={{
                                width: '56px',
                                padding: '4px',
                                textAlign: 'center',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-surface)',
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* SECTION D — ADDITIONAL SURCHARGES */}
          <Card style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>
                  SECTION D — Additional Surcharges & Accessorial Fees
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Active surcharges will be computed by the backend engine during booking quote generation.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => {
                  const newSurcharge: B2BSurcharge = {
                    id: `s-${Date.now()}`,
                    code: 'CUSTOM',
                    name: 'Custom Surcharge',
                    calcType: 'FIXED',
                    value: 10000,
                    status: 'ACTIVE',
                  };
                  setSurchargesList([...surchargesList, newSurcharge]);
                }}
              >
                + Add Surcharge
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {surchargesList.map((s, idx) => (
                <div
                  key={s.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr auto',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '10px 14px',
                    backgroundColor: 'var(--color-surface-secondary)',
                    borderRadius: '8px',
                  }}
                >
                  <Input
                    label={idx === 0 ? 'Name' : undefined}
                    value={s.name}
                    onChange={(e) => {
                      const updated = [...surchargesList];
                      updated[idx].name = e.target.value;
                      setSurchargesList(updated);
                    }}
                  />
                  <Input
                    label={idx === 0 ? 'Code' : undefined}
                    value={s.code}
                    onChange={(e) => {
                      const updated = [...surchargesList];
                      updated[idx].code = e.target.value.toUpperCase();
                      setSurchargesList(updated);
                    }}
                  />
                  <Select
                    label={idx === 0 ? 'Type' : undefined}
                    value={s.calcType}
                    onChange={(e) => {
                      const updated = [...surchargesList];
                      updated[idx].calcType = e.target.value as any;
                      setSurchargesList(updated);
                    }}
                    options={[
                      { value: 'FIXED', label: 'Fixed (₹)' },
                      { value: 'PERCENTAGE', label: 'Percentage (%)' },
                      { value: 'PER_KG', label: 'Per KG (₹)' },
                      { value: 'INVOICE_PERCENTAGE', label: 'Invoice %' },
                    ]}
                  />
                  <Input
                    label={idx === 0 ? 'Value' : undefined}
                    type="number"
                    value={s.calcType === 'PERCENTAGE' || s.calcType === 'INVOICE_PERCENTAGE' ? s.value : s.value / 100}
                    onChange={(e) => {
                      const updated = [...surchargesList];
                      const val = parseFloat(e.target.value) || 0;
                      updated[idx].value = s.calcType === 'PERCENTAGE' || s.calcType === 'INVOICE_PERCENTAGE' ? val : Math.round(val * 100);
                      setSurchargesList(updated);
                    }}
                  />
                  <Select
                    label={idx === 0 ? 'Status' : undefined}
                    value={s.status}
                    onChange={(e) => {
                      const updated = [...surchargesList];
                      updated[idx].status = e.target.value as any;
                      setSurchargesList(updated);
                    }}
                    options={[
                      { value: 'ACTIVE', label: 'ACTIVE' },
                      { value: 'INACTIVE', label: 'INACTIVE' },
                    ]}
                  />
                  <button
                    onClick={() => setSurchargesList(surchargesList.filter((_, i) => i !== idx))}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                    title="Remove Surcharge"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* FORM ACTION BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="ghost" onClick={() => setActiveViewMode('LIST')}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" leftIcon={<Save size={16} />} onClick={handleSaveRateCardSubmit}>
              Save B2B Rate Card Configuration
            </Button>
          </div>
        </div>
      )}

      {/* READ-ONLY SUMMARY VIEW MODAL */}
      {activeViewMode === 'VIEW' && viewingCard && (
        <Modal
          isOpen={true}
          onClose={() => {
            setActiveViewMode('LIST');
            setViewingCard(null);
          }}
          title={`B2B Rate Card Summary — ${viewingCard.name} (v${viewingCard.version})`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', padding: '14px', backgroundColor: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-default)' }}>
              <div><span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Courier Partner</span><div><strong>{viewingCard.courier_name}</strong></div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Service Name</span><div><strong>{viewingCard.service_name}</strong></div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Status</span><div><Badge variant={viewingCard.status === 'ACTIVE' ? 'success' : 'danger'}>{viewingCard.status}</Badge></div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Volumetric Divisor</span><div><strong>/{viewingCard.volumetric_divisor}</strong></div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Min Chargeable Wt</span><div><strong>{Math.round((viewingCard.min_chargeable_weight_grams || 20000) / 1000)} KG</strong></div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Min Freight Charge</span><div><strong>₹{((viewingCard.min_freight_charge_minor || 0) / 100).toFixed(2)}</strong></div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Weight Rounding</span><div><strong>{viewingCard.weight_rounding_rule}</strong></div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Fuel Surcharge</span><div><strong>{viewingCard.fuel_surcharge_percent}%</strong></div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Docket Charge</span><div><strong>₹{((viewingCard.docket_charge_minor || 0) / 100).toFixed(2)}</strong></div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>GST Percent</span><div><strong>{viewingCard.gst_percent}%</strong></div></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button variant="ghost" onClick={() => { setActiveViewMode('LIST'); setViewingCard(null); }}>
                Close
              </Button>
              <Button
                variant="primary"
                leftIcon={<Edit2 size={14} />}
                onClick={() => {
                  const card = viewingCard;
                  setViewingCard(null);
                  handleOpenEditForm(card);
                }}
              >
                Edit Configuration
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* AUDIT LOG HISTORY MODAL */}
      {isHistoryModalOpen && viewingCard && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setViewingCard(null);
          }}
          title={`Rate Version & Change Audit History — ${viewingCard.name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Audit trail recorded in PostgreSQL for rate card <strong>{viewingCard.name}</strong>. Rate changes are immutable to guarantee historical shipment reproducibility.
            </p>

            {isAuditLogsLoading ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                <span>Loading audit trail...</span>
              </div>
            ) : auditLogsList.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                No prior audit logs recorded yet for this rate card.
              </div>
            ) : (
              <Table<B2BRateCardAuditLog>
                keyExtractor={(log) => log.id}
                columns={[
                  {
                    key: 'action',
                    header: 'Action',
                    render: (l) => <Badge variant="brand">{l.action}</Badge>,
                  },
                  {
                    key: 'actor',
                    header: 'Changed By',
                    render: (l) => <strong>{l.actor}</strong>,
                  },
                  {
                    key: 'timestamp',
                    header: 'Timestamp',
                    render: (l) => <span style={{ fontSize: '11px' }}>{new Date(l.timestamp).toLocaleString()}</span>,
                  },
                  {
                    key: 'details',
                    header: 'Changelog / Details',
                    render: (l) => (
                      <span style={{ fontSize: '12px' }}>
                        {l.details?.changelog || l.details?.reason || JSON.stringify(l.details || {})}
                      </span>
                    ),
                  },
                ]}
                data={auditLogsList}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setViewingCard(null);
                }}
              >
                Close Audit Logs
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* PRICING ENGINE LIVE TEST DRAWER / MODAL */}
      {isTestCalculatorOpen && (
        <Modal
          isOpen={isTestCalculatorOpen}
          onClose={() => setIsTestCalculatorOpen(false)}
          title="B2B Pricing Engine — Live Calculation Sandbox"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Verify how the backend pricing engine computes volumetric weight, chargeable weight, minimum floor rules, zone rates, surcharges, and GST.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              <Input label="Origin Pincode" value={testOriginPin} onChange={(e) => setTestOriginPin(e.target.value)} />
              <Input label="Dest Pincode" value={testDestPin} onChange={(e) => setTestDestPin(e.target.value)} />
              <Input label="Dead Weight (KG)" type="number" value={testDeadWeightKg} onChange={(e) => setTestDeadWeightKg(e.target.value)} />
              <Input label="Length (cm)" type="number" value={testLengthCm} onChange={(e) => setTestLengthCm(e.target.value)} />
              <Input label="Width (cm)" type="number" value={testWidthCm} onChange={(e) => setTestWidthCm(e.target.value)} />
              <Input label="Height (cm)" type="number" value={testHeightCm} onChange={(e) => setTestHeightCm(e.target.value)} />
              <Input label="Box Qty" type="number" value={testBoxQty} onChange={(e) => setTestBoxQty(e.target.value)} />
              <Input label="Invoice Value (₹)" type="number" value={testInvoiceValueINR} onChange={(e) => setTestInvoiceValueINR(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<RefreshCw size={14} className={isTesting ? 'animate-spin' : ''} />}
                onClick={() => handleRunPricingTest()}
              >
                Calculate Price Quote
              </Button>
            </div>

            {testResult && (
              <div style={{ marginTop: '12px', padding: '14px', borderRadius: '8px', backgroundColor: testResult.success ? '#f8fafc' : '#fef2f2', border: `1px solid ${testResult.success ? '#cbd5e1' : '#fecaca'}` }}>
                {!testResult.success ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 'bold' }}>
                      <AlertTriangle size={18} />
                      <span>{testResult.code || 'CALCULATION_ERROR'}</span>
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#991b1b' }}>{testResult.message}</p>
                  </div>
                ) : testResult.breakdown ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                      <span style={{ fontWeight: 'bold', color: '#0f172a' }}>
                        {testResult.breakdown.courierName} — {testResult.breakdown.serviceName}
                      </span>
                      <Badge variant="brand">{testResult.breakdown.rateCardName} (v{testResult.breakdown.version})</Badge>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                      <div>Zone Route: <strong>{testResult.breakdown.originZone} → {testResult.breakdown.destinationZone}</strong></div>
                      <div>Volumetric Divisor: <strong>/{testResult.breakdown.divisorUsed}</strong></div>
                      <div>Dead Weight: <strong>{testResult.breakdown.totalDeadWeightKg} KG</strong></div>
                      <div>Volumetric Weight: <strong>{testResult.breakdown.totalVolumetricWeightKg.toFixed(2)} KG</strong></div>
                      <div>Rule Applied: <strong>{testResult.breakdown.roundingRuleApplied}</strong></div>
                      <div>Final Chargeable Weight: <strong style={{ color: 'var(--color-violet-main)' }}>{testResult.breakdown.finalChargeableWeightKg} KG</strong></div>
                      <div>Rate per KG: <strong>₹{testResult.breakdown.ratePerKgINR.toFixed(2)}</strong></div>
                      <div>Base Freight: <strong>₹{testResult.breakdown.baseFreightFinalINR.toFixed(2)}</strong></div>
                      <div>Fuel Surcharge ({testResult.breakdown.fuelSurchargePercent}%): <strong>₹{testResult.breakdown.fuelSurchargeINR.toFixed(2)}</strong></div>
                      <div>Docket Charge: <strong>₹{testResult.breakdown.docketChargeINR.toFixed(2)}</strong></div>
                      <div>Subtotal: <strong>₹{testResult.breakdown.subtotalBeforeGSTINR.toFixed(2)}</strong></div>
                      <div>GST ({testResult.breakdown.gstPercent}%): <strong>₹{testResult.breakdown.gstAmountINR.toFixed(2)}</strong></div>
                    </div>

                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '2px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Grand Total (Inclusive of GST):</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>
                        ₹{testResult.breakdown.grandTotalINR.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button variant="ghost" onClick={() => setIsTestCalculatorOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {isDeleteModalOpen && cardToDelete && (
        <ConfirmationDialog
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setCardToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete B2B Rate Card"
          description={`Are you sure you want to permanently delete Rate Card "${cardToDelete.name}" (${cardToDelete.id})? This action cannot be undone.`}
          confirmLabel="Delete Rate Card"
          cancelLabel="Cancel"
          variant="danger"
        />
      )}

      {/* EXCEL UPLOAD & MULTI-SHEET PREVIEW MODAL */}
      {isExcelModalOpen && (
        <Modal
          isOpen={isExcelModalOpen}
          onClose={() => {
            if (!isImportingSheets) {
              setIsExcelModalOpen(false);
              setWorkbookResult(null);
            }
          }}
          title="Upload & Preview Courier B2B Rate Cards (.xlsx)"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxHeight: '75vh', overflowY: 'auto' }}>
            {!workbookResult ? (
              <div
                style={{
                  border: '2px dashed var(--color-border)',
                  borderRadius: '12px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  backgroundColor: 'var(--color-surface-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-violet-main)' }}>
                  <FileSpreadsheet size={32} />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#0f172a' }}>
                    Upload Courier Wise B2B Rate Card (.xlsx)
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0, maxWidth: '440px' }}>
                    Supports multi-courier sheets in a single workbook (Delhivery, Ekart, Movin Standard Premium). Auto-detects asymmetric origin-destination zone matrices and charge rules.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <Button
                    variant="primary"
                    leftIcon={<Upload size={14} />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsingExcel}
                  >
                    {isParsingExcel ? 'Parsing Workbook...' : 'Select .xlsx File'}
                  </Button>
                  <a
                    href="/B2B_Rate_Card_Template.xlsx"
                    download="B2B_Rate_Card_Template.xlsx"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-default)',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: 'var(--color-violet-main)',
                      fontSize: '13px',
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    <Download size={14} /> Download Sample Excel Template
                  </a>
                </div>

                <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef3c7', border: '1px solid #fde68a', fontSize: '11px', color: '#92400e', textAlign: 'left', width: '100%', maxWidth: '520px' }}>
                  <strong>Admin Governance Notice:</strong> All imported sheets are saved strictly as <strong>DRAFT</strong>. Commercial rates will not be activated in production without your explicit review and one-click approval.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* WORKBOOK SUMMARY BAR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Workbook:</span>{' '}
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>{workbookResult.fileName}</strong>
                    <span style={{ marginLeft: '10px', fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>
                      ({workbookResult.sheets.length} courier sheet{workbookResult.sheets.length > 1 ? 's' : ''} detected)
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWorkbookResult(null)}
                  >
                    Upload Different File
                  </Button>
                </div>

                {/* SHEET TABS */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', overflowX: 'auto' }}>
                  {workbookResult.sheets.map((s, idx) => (
                    <button
                      key={s.sheetName}
                      onClick={() => {
                        setSelectedSheetIndex(idx);
                        setActiveSheetTab('MATRIX');
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: selectedSheetIndex === idx ? 'var(--color-violet-main)' : 'var(--color-surface-secondary)',
                        color: selectedSheetIndex === idx ? '#ffffff' : 'var(--color-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Layers size={13} />
                      {s.courierName} ({s.sheetName})
                      <Badge variant={selectedSheetIndex === idx ? 'neutral' : 'brand'}>
                        {s.totalRatesParsed} rates
                      </Badge>
                    </button>
                  ))}
                </div>

                {/* CURRENT SHEET OVERVIEW */}
                {(() => {
                  const currSheet = workbookResult.sheets[selectedSheetIndex];
                  if (!currSheet) return null;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* STATS CHIPS */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', padding: '12px', backgroundColor: 'var(--color-surface-secondary)', borderRadius: '8px', fontSize: '12px' }}>
                        <div><span style={{ color: '#64748b', fontSize: '11px' }}>Courier:</span><div><strong>{currSheet.courierName}</strong></div></div>
                        <div><span style={{ color: '#64748b', fontSize: '11px' }}>Divisor:</span><div><strong>/{currSheet.volumetricDivisor}</strong></div></div>
                        <div><span style={{ color: '#64748b', fontSize: '11px' }}>Min Weight:</span><div><strong>{currSheet.minChargeableWeightGrams / 1000} KG</strong></div></div>
                        <div><span style={{ color: '#64748b', fontSize: '11px' }}>Min Freight:</span><div><strong>₹{(currSheet.minFreightChargeMinor / 100).toFixed(0)}</strong></div></div>
                        <div><span style={{ color: '#64748b', fontSize: '11px' }}>Docket Fee:</span><div><strong>₹{(currSheet.docketChargeMinor / 100).toFixed(0)}</strong></div></div>
                        <div><span style={{ color: '#64748b', fontSize: '11px' }}>Fuel Surcharge:</span><div><strong>{currSheet.fuelSurchargePercent}%</strong></div></div>
                        <div><span style={{ color: '#64748b', fontSize: '11px' }}>Matrix Size:</span><div><strong>{currSheet.originZones.length}×{currSheet.destinationZones.length} ({currSheet.totalRatesParsed} pairs)</strong></div></div>
                        <div><span style={{ color: '#64748b', fontSize: '11px' }}>Default Status:</span><div><Badge variant="warning">DRAFT</Badge></div></div>
                      </div>

                      {/* WARNINGS & AMBIGUITY REVIEW */}
                      {currSheet.warnings.length > 0 && (
                        <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', fontSize: '11px', color: '#b45309' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', marginBottom: '4px' }}>
                            <AlertCircle size={14} /> Review Notes & Accessorial Highlights ({currSheet.warnings.length})
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '18px' }}>
                            {currSheet.warnings.map((w, i) => (
                              <li key={i} style={{ marginBottom: '2px' }}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* SUB-TABS */}
                      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                        <button
                          onClick={() => setActiveSheetTab('MATRIX')}
                          style={{
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: activeSheetTab === 'MATRIX' ? '#e0e7ff' : 'transparent',
                            color: activeSheetTab === 'MATRIX' ? 'var(--color-violet-main)' : '#64748b',
                          }}
                        >
                          Zone Rate Matrix ({currSheet.originZones.length}×{currSheet.destinationZones.length})
                        </button>
                        <button
                          onClick={() => setActiveSheetTab('CHARGES')}
                          style={{
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: activeSheetTab === 'CHARGES' ? '#e0e7ff' : 'transparent',
                            color: activeSheetTab === 'CHARGES' ? 'var(--color-violet-main)' : '#64748b',
                          }}
                        >
                          Extracted Charges & Rules ({currSheet.surcharges.length})
                        </button>
                      </div>

                      {/* SUB-TAB: MATRIX */}
                      {activeSheetTab === 'MATRIX' && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '11px', color: '#64748b' }}>
                            <span>Dynamic {currSheet.originZones.length}×{currSheet.destinationZones.length} Matrix. Click any cell to adjust ₹/KG before importing.</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-violet-main)' }}>Directional (Origin → Destination)</span>
                          </div>
                          <div style={{ overflowX: 'auto', maxHeight: '260px', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                              <thead>
                                <tr style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 3, borderBottom: '2px solid #cbd5e1' }}>
                                  <th style={{ padding: '6px', textAlign: 'left', minWidth: '60px', position: 'sticky', left: 0, backgroundColor: '#f8fafc', zIndex: 4 }}>From \ To</th>
                                  {currSheet.destinationZones.map((dz) => (
                                    <th key={dz} style={{ padding: '6px', textAlign: 'center', minWidth: '46px', color: 'var(--color-violet-main)' }}>{dz}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {currSheet.originZones.map((oz) => (
                                  <tr key={oz} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '4px 6px', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#ffffff', zIndex: 2, borderRight: '1px solid #e2e8f0' }}>{oz}</td>
                                    {currSheet.destinationZones.map((dz) => {
                                      const paise = currSheet.zoneMatrix[oz]?.[dz] ?? 0;
                                      const inr = (paise / 100).toFixed(2);
                                      return (
                                        <td key={dz} style={{ padding: '2px', textAlign: 'center' }}>
                                          <input
                                            type="number"
                                            step="0.10"
                                            value={inr}
                                            onChange={(e) => handleUpdateMatrixCellInParsedSheet(oz, dz, e.target.value)}
                                            style={{
                                              width: '46px',
                                              padding: '2px',
                                              textAlign: 'center',
                                              fontSize: '10px',
                                              fontWeight: 'bold',
                                              border: '1px solid #e2e8f0',
                                              borderRadius: '3px',
                                            }}
                                          />
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB: CHARGES */}
                      {activeSheetTab === 'CHARGES' && (
                        <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0 }}>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Charge Name</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Configured Value</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Category</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Condition / Rule Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currSheet.surcharges.map((sur, sIdx) => (
                                <tr key={sIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '8px', fontWeight: 600 }}>{sur.name} ({sur.code})</td>
                                  <td style={{ padding: '8px' }}><Badge variant="brand">{sur.calcType}</Badge></td>
                                  <td style={{ padding: '8px', fontWeight: 'bold' }}>
                                    {sur.calcType === 'PERCENTAGE' || sur.calcType === 'INVOICE_PERCENTAGE'
                                      ? `${sur.value}%`
                                      : `₹${(sur.value / 100).toFixed(2)}`}
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                    {sur.isPostShipment ? (
                                      <Badge variant="warning">Post-Shipment Fee</Badge>
                                    ) : (
                                      <Badge variant="success">Upfront Quote</Badge>
                                    )}
                                  </td>
                                  <td style={{ padding: '8px', fontSize: '10px', color: '#64748b' }}>
                                    {sur.formulaDescription || sur.rawLabel || 'Standard Accessorial'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* MODAL FOOTER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsExcelModalOpen(false);
                      setWorkbookResult(null);
                    }}
                    disabled={isImportingSheets}
                  >
                    Cancel
                  </Button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="outline"
                      onClick={() => handleImportSingleSheet(workbookResult.sheets[selectedSheetIndex])}
                      disabled={isImportingSheets}
                    >
                      Import Selected Sheet as Draft
                    </Button>
                    <Button
                      variant="primary"
                      leftIcon={<CheckCircle size={14} className={isImportingSheets ? 'animate-spin' : ''} />}
                      onClick={handleImportAllSheets}
                      disabled={isImportingSheets}
                    >
                      {isImportingSheets ? 'Importing Cards...' : `Import All (${workbookResult.sheets.length}) Sheets as Draft`}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* APPROVE & ACTIVATE DRAFT RATE CARD CONFIRMATION */}
      {isActivateConfirmOpen && cardToActivate && (
        <ConfirmationDialog
          isOpen={isActivateConfirmOpen}
          onClose={() => {
            setIsActivateConfirmOpen(false);
            setCardToActivate(null);
          }}
          onConfirm={handleConfirmActivate}
          title="Approve & Activate B2B Rate Card"
          description={`Are you sure you want to approve and activate "${cardToActivate.name}" (${cardToActivate.courier_name} - ${cardToActivate.service_name})? This will immediately make this rate card authoritative for live booking calculations. Any previous active cards for this courier will be safely archived with full audit logging.`}
          confirmLabel={isActivating ? 'Activating...' : 'Approve & Activate Now'}
          cancelLabel="Keep as Draft"
          variant="primary"
        />
      )}

      {/* MERCHANT PRICING & MARKUP CONFIGURATION MODAL */}
      {isMarkupModalOpen && cardForMarkup && (
        <Modal
          isOpen={isMarkupModalOpen}
          onClose={() => {
            setIsMarkupModalOpen(false);
            setCardForMarkup(null);
          }}
          title={`Merchant Pricing & Markup — ${cardForMarkup.name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Control your profit margin by applying fixed or percentage markup over the base courier contract cost. Base courier costs and internal rate rules are NEVER exposed to merchants or sellers.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '12px', backgroundColor: 'var(--color-surface-secondary)', borderRadius: '8px' }}>
              <Select
                label="Card Pricing Role *"
                value={markupCardType}
                onChange={(e) => setMarkupCardType(e.target.value)}
                options={[
                  { value: 'BASE_COST', label: 'Base Courier Contract Cost (Cost Price)' },
                  { value: 'SELLER_SELLING', label: 'Merchant Selling Rate (Includes Markup)' },
                  { value: 'MERCHANT_OVERRIDE', label: 'Merchant-Specific Custom Override' },
                ]}
              />

              <Select
                label="Markup Calculation Type *"
                value={markupType}
                onChange={(e) => setMarkupType(e.target.value as any)}
                options={[
                  { value: 'PERCENTAGE', label: 'Percentage Markup on Freight (%)' },
                  { value: 'FIXED_PER_KG', label: 'Fixed Markup per KG (₹/KG)' },
                  { value: 'FIXED_PER_DOCKET', label: 'Fixed Docket Markup (₹/Shipment)' },
                  { value: 'NONE', label: 'No Markup (Pass-Through Cost)' },
                ]}
              />

              <Input
                label={markupType === 'PERCENTAGE' ? 'Markup Value (%)' : markupType === 'NONE' ? 'Markup (Disabled)' : 'Markup Value (₹)'}
                type="number"
                step="0.5"
                disabled={markupType === 'NONE'}
                value={markupType === 'NONE' ? '0' : markupValue}
                onChange={(e) => setMarkupValue(e.target.value)}
              />
            </div>

            {/* LIVE PROFIT SIMULATOR */}
            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} /> Live Commercial Margin Simulator (Sample 25 KG Cargo Shipment)
              </div>
              {(() => {
                const sampleBaseFreight = 200; // 25 KG * 8/KG
                const sampleDocket = (cardForMarkup.docket_charge_minor || 6500) / 100;
                const sampleFuel = sampleBaseFreight * ((cardForMarkup.fuel_surcharge_percent || 15) / 100);
                const sampleCostBeforeMarkup = sampleBaseFreight + sampleDocket + sampleFuel;

                let markupAmt = 0;
                const numVal = parseFloat(markupValue) || 0;
                if (markupType === 'PERCENTAGE') {
                  markupAmt = sampleBaseFreight * (numVal / 100);
                } else if (markupType === 'FIXED_PER_KG') {
                  markupAmt = 25 * numVal;
                } else if (markupType === 'FIXED_PER_DOCKET') {
                  markupAmt = numVal;
                }

                const sellingPrice = sampleCostBeforeMarkup + markupAmt;
                const marginPct = sellingPrice > 0 ? (markupAmt / sellingPrice) * 100 : 0;

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>Base Courier Cost:</span>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>₹{sampleCostBeforeMarkup.toFixed(2)}</div>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>Markup Earned:</span>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#16a34a' }}>+₹{markupAmt.toFixed(2)}</div>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>Merchant Selling Price:</span>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-violet-main)' }}>₹{sellingPrice.toFixed(2)}</div>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>Gross Profit Margin:</span>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#059669' }}>{marginPct.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="ghost" onClick={() => setIsMarkupModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveMarkup}
                disabled={isSavingMarkup}
              >
                {isSavingMarkup ? 'Saving...' : 'Save Merchant Pricing Rules'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
