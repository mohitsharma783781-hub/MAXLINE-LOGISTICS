import { WalletService } from '../mocks/wallet.mock';
import { GstInvoiceService } from './gstInvoiceService';
import { RealtimeNotificationService } from './realtimeNotificationService';

export type DiscrepancyStatus =
  | 'DISCREPANCY_DETECTED'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'COURIER_REVIEW'
  | 'NEED_MORE_EVIDENCE'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLOSED'
  | 'DISPUTE_FILED'
  | 'EVIDENCE_REQUIRED'
  | 'SUBMITTED_TO_COURIER'
  | 'COURIER_RESPONSE_PENDING'
  | 'ACCEPTED'
  | 'PARTIALLY_ACCEPTED'
  | 'EXPIRED'
  | 'REOPENED';

export type EvidenceFileType =
  | 'PACKAGE_PHOTO'
  | 'WEIGHT_SCALE_PHOTO'
  | 'PACKING_IMAGE'
  | 'INVOICE_COPY'
  | 'VIDEO_PROOF'
  | 'ADDITIONAL_DOC';

export interface BookedWeightSnapshot {
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  appliedRateCardId: string;
  appliedRateCardName: string;
  appliedFreightINR: number;
  appliedAdditionalChargesINR: number;
  appliedGstINR: number;
  finalShipmentChargeINR: number;
}

export interface CourierWeightAudit {
  auditDate: string;
  auditTime: string;
  courierId: string;
  courierName: string;
  courierAwb: string;
  auditedActualWeightKg: number;
  auditedLengthCm: number;
  auditedWidthCm: number;
  auditedHeightCm: number;
  auditedVolumetricWeightKg: number;
  auditedChargeableWeightKg: number;
  auditSource: 'HUB_SCAN' | 'IN_TRANSIT_REWEIGH' | 'COURIER_API' | 'MANUAL_IMPORT';
  courierDiscrepancyRef: string;
  courierProofUrls?: string[];
  isPackageLevel?: boolean;
  packageBreakdown?: {
    packageId: string;
    packageName: string;
    bookedWeightKg: number;
    auditedWeightKg: number;
    differenceKg: number;
  }[];
  shipmentLevelNote?: string;
}

export interface DiscrepancyProofAttachment {
  id: string;
  name: string;
  type: EvidenceFileType | 'WEIGHING_SCALE' | 'BOX_DIMENSIONS' | 'SHIPPING_LABEL' | 'PACKAGE_PHOTO' | 'OTHER';
  url: string;
  fileSizeBytes?: number;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface AuditTimelineEvent {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  role: 'CUSTOMER' | 'ADMIN' | 'COURIER_SYSTEM' | 'SYSTEM';
  status: DiscrepancyStatus;
  notes?: string;
}

export interface InternalNote {
  id: string;
  note: string;
  author: string;
  createdAt: string;
}

export interface CourierSubmissionDetails {
  courierRef: string;
  submittedAt: string;
  method: 'PORTAL_API' | 'EMAIL_ESCALATION' | 'COURIER_PORTAL_LOG' | 'MANUAL';
  supportingDocsCount: number;
  adminNote?: string;
}

export interface CourierResponseDetails {
  responseDate: string;
  courierRef: string;
  acceptedStatus: 'APPROVED' | 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED';
  courierComments: string;
  courierDecision?: string;
  supportingFiles?: string[];
  finalApprovedActualWeightKg?: number;
  finalApprovedLengthCm?: number;
  finalApprovedWidthCm?: number;
  finalApprovedHeightCm?: number;
  finalApprovedVolumetricKg?: number;
  finalApprovedChargeableKg?: number;
  finalAdditionalChargeINR: number;
}

// Financial Impact Breakdown Structure
export interface FinancialImpactBreakdown {
  originalFreightChargeINR: number;
  additionalChargeINR: number;
  disputedAmountINR: number;
  approvedRefundINR: number;
  finalAdjustedChargeINR: number;
}

export interface WeightDiscrepancyRecord extends Record<string, unknown> {
  id: string;
  discrepancyId: string;
  shipmentId: string;
  awbNumber: string;
  lrnNumber: string;
  orderId: string;
  tenantId: string;
  merchantName: string;
  merchantCompany?: string;
  pickupWarehouse: string;
  destinationCity: string;

  // Immutable Snapshots
  bookedSnapshot: BookedWeightSnapshot;
  courierAudit: CourierWeightAudit;

  // Audit Differences
  weightDiffKg: number;
  additionalChargeINR: number;

  // Financial Impact Breakdown
  financialImpact: FinancialImpactBreakdown;

  // Dates & Window
  discrepancyNoticeDate: string;
  disputeDeadline: string;
  status: DiscrepancyStatus;

  // Customer Dispute Data
  disputeReason?:
    | 'Courier weight appears incorrect'
    | 'Courier dimensions appear incorrect'
    | 'Volumetric weight appears incorrect'
    | 'Package was weighed incorrectly'
    | 'Wrong package measurement'
    | 'Duplicate weight adjustment'
    | 'Other';
  customerComment?: string;
  proofAttachments: DiscrepancyProofAttachment[];

  // Admin & Ops Handling
  assignedStaff?: string;
  evidenceRequested?: boolean;
  evidenceRequestReason?: string;
  internalNotes: InternalNote[];
  courierSubmissionDetails?: CourierSubmissionDetails;
  courierResponseDetails?: CourierResponseDetails;

  // Financial Ledger Links & Credit Notes
  walletLedgerDebitRef?: string;
  walletLedgerCreditRef?: string;
  creditNoteNumber?: string;
  refundCreditINR: number;

  // Final Settlement
  finalApprovedWeightKg?: number;
  adminOverrideReason?: string;

  // Audit History
  auditTimeline: AuditTimelineEvent[];

  createdAt: string;
  updatedAt: string;
}

export interface DisputeWindowConfig {
  defaultWindowDays: number;
  reminderTimingDays: number[];
}

let DISPUTE_CONFIG: DisputeWindowConfig = {
  defaultWindowDays: 7,
  reminderTimingDays: [3, 1],
};

const getDeadlineDate = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
};

export const INITIAL_WEIGHT_DISCREPANCIES: WeightDiscrepancyRecord[] = [
  {
    id: 'wd-rec-101',
    discrepancyId: 'WD-20260825-001',
    shipmentId: 'SHP-ORD-2026-9041',
    awbNumber: 'DEL847192031',
    lrnNumber: 'LRN-98401',
    orderId: 'ORD-2026-9041',
    tenantId: 'tenant-demo-01',
    merchantName: 'Acme Merchants Ltd',
    merchantCompany: 'Acme Logistics Solutions',
    pickupWarehouse: 'Bhiwandi Hub - FC-1',
    destinationCity: 'Bengaluru, KA',

    bookedSnapshot: {
      actualWeightKg: 20.0,
      lengthCm: 40,
      widthCm: 30,
      heightCm: 25,
      volumetricWeightKg: 6.0,
      chargeableWeightKg: 20.0,
      appliedRateCardId: 'RC-STD-SURFACE-2026',
      appliedRateCardName: 'Standard Surface Rate Card v2',
      appliedFreightINR: 450.0,
      appliedAdditionalChargesINR: 30.0,
      appliedGstINR: 86.4,
      finalShipmentChargeINR: 566.4,
    },

    courierAudit: {
      auditDate: '2026-08-22',
      auditTime: '11:30 AM',
      courierId: 'delhivery',
      courierName: 'Delhivery Surface',
      courierAwb: 'DEL847192031',
      auditedActualWeightKg: 28.0,
      auditedLengthCm: 45,
      auditedWidthCm: 35,
      auditedHeightCm: 30,
      auditedVolumetricWeightKg: 9.45,
      auditedChargeableWeightKg: 28.0,
      auditSource: 'HUB_SCAN',
      courierDiscrepancyRef: 'AUD-DEL-9918231',
      courierProofUrls: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500'],
      isPackageLevel: true,
      packageBreakdown: [
        { packageId: 'PKG-1', packageName: 'Box 1/2', bookedWeightKg: 10.0, auditedWeightKg: 10.0, differenceKg: 0 },
        { packageId: 'PKG-2', packageName: 'Box 2/2', bookedWeightKg: 10.0, auditedWeightKg: 18.0, differenceKg: 8.0 },
      ],
    },

    weightDiffKg: 8.0,
    additionalChargeINR: 420.0,
    financialImpact: {
      originalFreightChargeINR: 450.0,
      additionalChargeINR: 420.0,
      disputedAmountINR: 420.0,
      approvedRefundINR: 0,
      finalAdjustedChargeINR: 870.0,
    },
    discrepancyNoticeDate: '2026-08-22 11:30 AM',
    disputeDeadline: getDeadlineDate(5),
    status: 'SUBMITTED',

    proofAttachments: [],
    internalNotes: [
      {
        id: 'note-1',
        note: 'Automated discrepancy notice generated from Delhivery Hub Scan API.',
        author: 'System Automated Audit',
        createdAt: '2026-08-22 11:30 AM',
      },
    ],
    walletLedgerDebitRef: 'tx-wd-debit-101',
    refundCreditINR: 0,
    auditTimeline: [
      {
        id: 'evt-3',
        timestamp: '2026-08-22 11:35 AM',
        event: 'Dispute Submitted by Merchant',
        actor: 'Acme Merchants Ltd',
        role: 'CUSTOMER',
        status: 'SUBMITTED',
        notes: 'Dispute submitted for 8.0 KG weight discrepancy on AWB DEL847192031.',
      },
      {
        id: 'evt-2',
        timestamp: '2026-08-22 11:30 AM',
        event: 'Courier Reweigh Audit Received (28.0 KG)',
        actor: 'Delhivery Hub Scanner',
        role: 'COURIER_SYSTEM',
        status: 'DISCREPANCY_DETECTED',
        notes: 'Discrepancy detected: +8.0 KG (+₹420.00 additional charge).',
      },
      {
        id: 'evt-1',
        timestamp: '2026-08-20 10:00 AM',
        event: 'Shipment Booked & Weight Frozen',
        actor: 'Acme Merchants Ltd',
        role: 'CUSTOMER',
        status: 'DISCREPANCY_DETECTED',
        notes: 'Booked Weight: 20.0 KG frozen permanently.',
      },
    ],

    createdAt: '2026-08-22 11:30 AM',
    updatedAt: '2026-08-22 11:35 AM',
  },

  {
    id: 'wd-rec-102',
    discrepancyId: 'WD-20260820-002',
    shipmentId: 'SHP-ORD-2026-8812',
    awbNumber: 'BD749102834',
    lrnNumber: 'LRN-98402',
    orderId: 'ORD-2026-8812',
    tenantId: 'tenant-demo-01',
    merchantName: 'Acme Merchants Ltd',
    merchantCompany: 'Acme Logistics Solutions',
    pickupWarehouse: 'Gurugram Hub',
    destinationCity: 'Mumbai, MH',

    bookedSnapshot: {
      actualWeightKg: 1.0,
      lengthCm: 15,
      widthCm: 15,
      heightCm: 10,
      volumetricWeightKg: 0.45,
      chargeableWeightKg: 1.0,
      appliedRateCardId: 'RC-AIR-EXPRESS-2026',
      appliedRateCardName: 'Air Express Premium',
      appliedFreightINR: 120.0,
      appliedAdditionalChargesINR: 15.0,
      appliedGstINR: 24.3,
      finalShipmentChargeINR: 159.3,
    },

    courierAudit: {
      auditDate: '2026-08-20',
      auditTime: '09:15 AM',
      courierId: 'bluedart',
      courierName: 'Blue Dart Air',
      courierAwb: 'BD749102834',
      auditedActualWeightKg: 3.5,
      auditedLengthCm: 30,
      auditedWidthCm: 25,
      auditedHeightCm: 18,
      auditedVolumetricWeightKg: 2.7,
      auditedChargeableWeightKg: 3.5,
      auditSource: 'HUB_SCAN',
      courierDiscrepancyRef: 'AUD-BD-74910',
      isPackageLevel: false,
    },

    weightDiffKg: 2.5,
    additionalChargeINR: 280.0,
    financialImpact: {
      originalFreightChargeINR: 120.0,
      additionalChargeINR: 280.0,
      disputedAmountINR: 280.0,
      approvedRefundINR: 0,
      finalAdjustedChargeINR: 400.0,
    },
    discrepancyNoticeDate: '2026-08-20 09:15 AM',
    disputeDeadline: getDeadlineDate(3),
    status: 'COURIER_REVIEW',

    disputeReason: 'Courier weight appears incorrect',
    customerComment: 'Package was weighed at dispatch counter. Digital scale showed 1.02 KG. Scale photos attached.',
    proofAttachments: [
      {
        id: 'prf-1',
        name: 'weighing_scale_proof_BD749102834.jpg',
        type: 'WEIGHT_SCALE_PHOTO',
        url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500',
        uploadedAt: '2026-08-21 14:00 PM',
        uploadedBy: 'Merchant Staff',
      },
    ],
    assignedStaff: 'Ramesh Kumar (Ops Lead)',
    internalNotes: [
      {
        id: 'note-2',
        note: 'Scale image looks authentic. Escalated to Blue Dart commercial desk.',
        author: 'Ramesh Kumar',
        createdAt: '2026-08-21 15:30 PM',
      },
    ],
    courierSubmissionDetails: {
      courierRef: 'BD-DISP-REF-8812',
      submittedAt: '2026-08-21 16:00 PM',
      method: 'EMAIL_ESCALATION',
      supportingDocsCount: 1,
      adminNote: 'Sent scale proof to Blue Dart hub manager.',
    },
    walletLedgerDebitRef: 'tx-wd-debit-102',
    refundCreditINR: 0,
    auditTimeline: [
      {
        id: 'evt-12',
        timestamp: '2026-08-21 16:00 PM',
        event: 'Submitted to Courier Review Desk',
        actor: 'Ramesh Kumar',
        role: 'ADMIN',
        status: 'COURIER_REVIEW',
        notes: 'Escalation ref: BD-DISP-REF-8812.',
      },
      {
        id: 'evt-11',
        timestamp: '2026-08-21 14:00 PM',
        event: 'Under Review by Logistics Ops',
        actor: 'Ramesh Kumar',
        role: 'ADMIN',
        status: 'UNDER_REVIEW',
      },
      {
        id: 'evt-10',
        timestamp: '2026-08-20 09:15 AM',
        event: 'Discrepancy Notice Issued (3.5 KG vs 1.0 KG Booked)',
        actor: 'Blue Dart System',
        role: 'COURIER_SYSTEM',
        status: 'DISCREPANCY_DETECTED',
      },
    ],

    createdAt: '2026-08-20 09:15 AM',
    updatedAt: '2026-08-21 16:00 PM',
  },

  {
    id: 'wd-rec-103',
    discrepancyId: 'WD-20260815-003',
    shipmentId: 'SHP-ORD-2026-7734',
    awbNumber: 'DTDC991823',
    lrnNumber: 'LRN-98403',
    orderId: 'ORD-2026-7734',
    tenantId: 'tenant-demo-01',
    merchantName: 'Acme Merchants Ltd',
    merchantCompany: 'Acme Logistics Solutions',
    pickupWarehouse: 'Ahmedabad FC',
    destinationCity: 'Delhi NCR',

    bookedSnapshot: {
      actualWeightKg: 0.5,
      lengthCm: 12,
      widthCm: 10,
      heightCm: 6,
      volumetricWeightKg: 0.14,
      chargeableWeightKg: 0.5,
      appliedRateCardId: 'RC-STD-SURFACE-2026',
      appliedRateCardName: 'Standard Surface Rate Card v2',
      appliedFreightINR: 65.0,
      appliedAdditionalChargesINR: 10.0,
      appliedGstINR: 13.5,
      finalShipmentChargeINR: 88.5,
    },

    courierAudit: {
      auditDate: '2026-08-15',
      auditTime: '16:45 PM',
      courierId: 'dtdc',
      courierName: 'DTDC Express',
      courierAwb: 'DTDC991823',
      auditedActualWeightKg: 1.2,
      auditedLengthCm: 18,
      auditedWidthCm: 14,
      auditedHeightCm: 8,
      auditedVolumetricWeightKg: 0.4,
      auditedChargeableWeightKg: 1.2,
      auditSource: 'HUB_SCAN',
      courierDiscrepancyRef: 'AUD-DTDC-991',
    },

    weightDiffKg: 0.7,
    additionalChargeINR: 65.0,
    financialImpact: {
      originalFreightChargeINR: 65.0,
      additionalChargeINR: 65.0,
      disputedAmountINR: 65.0,
      approvedRefundINR: 65.0,
      finalAdjustedChargeINR: 65.0,
    },
    discrepancyNoticeDate: '2026-08-15 16:45 PM',
    disputeDeadline: getDeadlineDate(-2),
    status: 'APPROVED',

    disputeReason: 'Volumetric weight appears incorrect',
    customerComment: 'Volumetric divisor mismatch resolved by carrier.',
    proofAttachments: [],
    assignedStaff: 'Priya Sharma (Ops Admin)',
    internalNotes: [
      {
        id: 'note-3',
        note: 'DTDC hub scale miscalibration verified. Refund approved.',
        author: 'Priya Sharma',
        createdAt: '2026-08-18 11:00 AM',
      },
    ],
    courierResponseDetails: {
      responseDate: '2026-08-18 10:30 AM',
      courierRef: 'DTDC-SETTLE-881',
      acceptedStatus: 'APPROVED',
      courierComments: 'DTDC hub scale recalibrated. Merchant original 0.5 KG accepted.',
      courierDecision: 'Dispute Approved & Full Credit Issued',
      finalApprovedActualWeightKg: 0.5,
      finalApprovedChargeableKg: 0.5,
      finalAdditionalChargeINR: 0,
    },
    walletLedgerDebitRef: 'tx-wd-debit-103',
    walletLedgerCreditRef: 'tx-wd-credit-103',
    creditNoteNumber: 'CN-2026-000001',
    refundCreditINR: 65.0,
    finalApprovedWeightKg: 0.5,

    auditTimeline: [
      {
        id: 'evt-22',
        timestamp: '2026-08-18 11:00 AM',
        event: 'Dispute Approved & Credit Note CN-2026-000001 Generated (₹65.00 Refunded)',
        actor: 'Priya Sharma',
        role: 'ADMIN',
        status: 'APPROVED',
        notes: 'Full refund credit issued to wallet and billing ledger updated.',
      },
      {
        id: 'evt-21',
        timestamp: '2026-08-16 10:00 AM',
        event: 'Customer Filed Dispute',
        actor: 'Acme Merchants Ltd',
        role: 'CUSTOMER',
        status: 'SUBMITTED',
      },
      {
        id: 'evt-20',
        timestamp: '2026-08-15 16:45 PM',
        event: 'Discrepancy Detected (+0.7 KG)',
        actor: 'DTDC System',
        role: 'COURIER_SYSTEM',
        status: 'DISCREPANCY_DETECTED',
      },
    ],

    createdAt: '2026-08-15 16:45 PM',
    updatedAt: '2026-08-18 11:00 AM',
  },
];

let DISCREPANCY_STORE: WeightDiscrepancyRecord[] = [...INITIAL_WEIGHT_DISCREPANCIES];

export const WeightDiscrepancyService = {
  // Config Management
  getConfig: (): DisputeWindowConfig => {
    return { ...DISPUTE_CONFIG };
  },

  updateConfig: (newWindowDays: number, reminderDays: number[]): DisputeWindowConfig => {
    DISPUTE_CONFIG = {
      defaultWindowDays: Math.max(1, newWindowDays),
      reminderTimingDays: reminderDays,
    };
    return { ...DISPUTE_CONFIG };
  },

  // Queries
  getDiscrepancies: (tenantId = 'all', statusSubmenu = 'ALL'): WeightDiscrepancyRecord[] => {
    return DISCREPANCY_STORE.filter((d) => {
      if (tenantId !== 'all' && d.tenantId !== tenantId) return false;
      if (statusSubmenu === 'OPEN' && !['SUBMITTED', 'UNDER_REVIEW', 'COURIER_REVIEW', 'NEED_MORE_EVIDENCE', 'DISCREPANCY_DETECTED', 'EVIDENCE_REQUIRED', 'DISPUTE_FILED', 'SUBMITTED_TO_COURIER'].includes(d.status)) return false;
      if (statusSubmenu === 'APPROVED' && !['APPROVED', 'ACCEPTED', 'PARTIALLY_ACCEPTED'].includes(d.status)) return false;
      if (statusSubmenu === 'REJECTED' && !['REJECTED'].includes(d.status)) return false;
      if (statusSubmenu === 'AUDIT_HISTORY' && !['APPROVED', 'REJECTED', 'CLOSED', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'EXPIRED'].includes(d.status)) return false;
      return true;
    });
  },

  getDiscrepancyById: (id: string): WeightDiscrepancyRecord | null => {
    return DISCREPANCY_STORE.find((d) => d.id === id || d.discrepancyId === id) || null;
  },

  getDiscrepancyByAwb: (awb: string): WeightDiscrepancyRecord | null => {
    return DISCREPANCY_STORE.find((d) => d.awbNumber === awb || d.courierAudit.courierAwb === awb) || null;
  },

  // File Dispute (Merchant Workflow)
  fileDispute: (input: {
    discrepancyId: string;
    disputeReason: WeightDiscrepancyRecord['disputeReason'];
    customerComment: string;
    proofAttachments?: DiscrepancyProofAttachment[];
  }): { success: boolean; message: string; disputeId?: string } => {
    const record = WeightDiscrepancyService.getDiscrepancyById(input.discrepancyId);
    if (!record) return { success: false, message: 'Discrepancy record not found.' };

    record.status = 'SUBMITTED';
    record.disputeReason = input.disputeReason;
    record.customerComment = input.customerComment;

    if (input.proofAttachments && input.proofAttachments.length > 0) {
      record.proofAttachments = [...record.proofAttachments, ...input.proofAttachments];
    }

    record.evidenceRequested = false;
    record.updatedAt = new Date().toLocaleString();

    record.auditTimeline.unshift({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      event: `Dispute Submitted by Merchant (${record.discrepancyId})`,
      actor: record.merchantName,
      role: 'CUSTOMER',
      status: 'SUBMITTED',
      notes: `Reason: ${input.disputeReason}. Proof files attached: ${record.proofAttachments.length}`,
    });

    // Notification Trigger
    RealtimeNotificationService.triggerEvent({
      tenantId: record.tenantId,
      eventType: 'WEIGHT_DISCREPANCY',
      category: 'Finance',
      priority: 'HIGH',
      title: `Weight Dispute ${record.discrepancyId} Submitted`,
      message: `Dispute filed for AWB ${record.awbNumber}. Additional charge ₹${record.additionalChargeINR} under audit review.`,
      awbNumber: record.awbNumber,
      orderId: record.orderId,
    });

    return {
      success: true,
      message: `Weight Dispute ${record.discrepancyId} submitted successfully! Our Ops team will review your evidence.`,
      disputeId: record.discrepancyId,
    };
  },

  // Evidence Proof Attachment Upload
  addCustomerProof: (
    discrepancyId: string,
    proof: DiscrepancyProofAttachment
  ): { success: boolean; message: string } => {
    const record = WeightDiscrepancyService.getDiscrepancyById(discrepancyId);
    if (!record) return { success: false, message: 'Discrepancy record not found.' };

    record.proofAttachments.push(proof);
    record.updatedAt = new Date().toLocaleString();

    record.auditTimeline.unshift({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      event: `Evidence Proof Attached (${proof.name})`,
      actor: record.merchantName,
      role: 'CUSTOMER',
      status: record.status,
    });

    return { success: true, message: 'Evidence proof uploaded and attached to dispute file.' };
  },

  // Admin Actions: Approve, Reject, Need More Evidence, Escalate, Close
  adminApproveDispute: (
    discrepancyId: string,
    approvedRefundINR: number,
    adminNotes: string,
    adminUser = 'Super Admin Ops'
  ): { success: boolean; message: string; creditNoteNumber?: string } => {
    const record = WeightDiscrepancyService.getDiscrepancyById(discrepancyId);
    if (!record) return { success: false, message: 'Discrepancy record not found.' };

    record.status = 'APPROVED';
    record.refundCreditINR = approvedRefundINR;
    record.finalApprovedWeightKg = record.bookedSnapshot.chargeableWeightKg;

    // Financial Impact Update
    record.financialImpact.approvedRefundINR = approvedRefundINR;
    record.financialImpact.finalAdjustedChargeINR = Math.max(
      0,
      record.financialImpact.originalFreightChargeINR + record.additionalChargeINR - approvedRefundINR
    );

    // Credit Note Integration
    const cnRes = GstInvoiceService.createCreditNote({
      invoiceNumber: 'B2B-2026-000001',
      adjustmentCategory: 'Weight Dispute Adjustment',
      adjustedTaxableINR: Math.round(approvedRefundINR / 1.18),
      reason: `Approved Weight Dispute ${record.discrepancyId} (AWB: ${record.awbNumber})`,
      adminUser,
    });

    if (cnRes.success && cnRes.creditNote) {
      record.creditNoteNumber = cnRes.creditNote.noteNumber;
    }

    // Wallet Credit Transaction
    const creditRef = `tx-wd-credit-${Date.now()}`;
    record.walletLedgerCreditRef = creditRef;
    WalletService.recharge(
      approvedRefundINR,
      `Weight Dispute Refund Approved (${record.discrepancyId} • AWB ${record.awbNumber})`
    );

    record.courierResponseDetails = {
      responseDate: new Date().toLocaleString(),
      courierRef: `CN-APP-${Date.now()}`,
      acceptedStatus: 'APPROVED',
      courierComments: adminNotes,
      courierDecision: 'Approved & Excess Charges Refunded',
      finalAdditionalChargeINR: 0,
    };

    record.updatedAt = new Date().toLocaleString();

    record.auditTimeline.unshift({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      event: `Dispute Approved & Credit Note ${record.creditNoteNumber || 'Issued'} Generated (₹${approvedRefundINR.toFixed(2)} Credited)`,
      actor: adminUser,
      role: 'ADMIN',
      status: 'APPROVED',
      notes: adminNotes,
    });

    // Trigger Notifications
    RealtimeNotificationService.triggerEvent({
      tenantId: record.tenantId,
      eventType: 'WEIGHT_DISCREPANCY',
      category: 'Finance',
      priority: 'HIGH',
      title: `Weight Dispute ${record.discrepancyId} Approved!`,
      message: `Credit Note ${record.creditNoteNumber || ''} issued. ₹${approvedRefundINR.toFixed(2)} refunded to wallet.`,
      awbNumber: record.awbNumber,
    });

    return {
      success: true,
      message: `Dispute Approved! Credit Note ${record.creditNoteNumber || ''} generated and ₹${approvedRefundINR.toFixed(2)} credited to merchant wallet.`,
      creditNoteNumber: record.creditNoteNumber,
    };
  },

  adminRejectDispute: (
    discrepancyId: string,
    rejectionReason: string,
    adminUser = 'Super Admin Ops'
  ): { success: boolean; message: string } => {
    const record = WeightDiscrepancyService.getDiscrepancyById(discrepancyId);
    if (!record) return { success: false, message: 'Discrepancy record not found.' };

    record.status = 'REJECTED';
    record.refundCreditINR = 0;
    record.finalApprovedWeightKg = record.courierAudit.auditedChargeableWeightKg;

    record.courierResponseDetails = {
      responseDate: new Date().toLocaleString(),
      courierRef: `REJ-${Date.now()}`,
      acceptedStatus: 'REJECTED',
      courierComments: rejectionReason,
      courierDecision: 'Courier Reweigh Scan Confirmed Valid',
      finalAdditionalChargeINR: record.additionalChargeINR,
    };

    record.updatedAt = new Date().toLocaleString();

    record.auditTimeline.unshift({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      event: 'Dispute Rejected after Evidence Audit',
      actor: adminUser,
      role: 'ADMIN',
      status: 'REJECTED',
      notes: rejectionReason,
    });

    RealtimeNotificationService.triggerEvent({
      tenantId: record.tenantId,
      eventType: 'WEIGHT_DISCREPANCY',
      category: 'Finance',
      priority: 'MEDIUM',
      title: `Weight Dispute ${record.discrepancyId} Rejected`,
      message: `Dispute rejected after verification. Reason: ${rejectionReason}`,
      awbNumber: record.awbNumber,
    });

    return { success: true, message: `Dispute ${record.discrepancyId} rejected. Original billing maintained.` };
  },

  adminRequestEvidence: (
    discrepancyId: string,
    reason: string,
    adminUser = 'Super Admin Ops'
  ): { success: boolean; message: string } => {
    const record = WeightDiscrepancyService.getDiscrepancyById(discrepancyId);
    if (!record) return { success: false, message: 'Record not found.' };

    record.status = 'NEED_MORE_EVIDENCE';
    record.evidenceRequested = true;
    record.evidenceRequestReason = reason;
    record.updatedAt = new Date().toLocaleString();

    record.auditTimeline.unshift({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      event: 'Additional Evidence Requested from Merchant',
      actor: adminUser,
      role: 'ADMIN',
      status: 'NEED_MORE_EVIDENCE',
      notes: reason,
    });

    return { success: true, message: 'Evidence request sent to merchant.' };
  },

  // Assign Staff (Admin)
  assignStaff: (
    discrepancyId: string,
    staffName: string,
    adminUser = 'Super Admin Ops'
  ): { success: boolean; message: string } => {
    const record = WeightDiscrepancyService.getDiscrepancyById(discrepancyId);
    if (!record) return { success: false, message: 'Record not found.' };

    record.assignedStaff = staffName;
    record.updatedAt = new Date().toLocaleString();

    record.auditTimeline.unshift({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      event: `Assigned to Ops Lead (${staffName})`,
      actor: adminUser,
      role: 'ADMIN',
      status: record.status,
    });

    return { success: true, message: `Dispute assigned to ${staffName}.` };
  },

  // Add Internal Note (Admin)
  addInternalNote: (
    discrepancyId: string,
    note: string,
    author = 'Super Admin Ops'
  ): { success: boolean; message: string } => {
    const record = WeightDiscrepancyService.getDiscrepancyById(discrepancyId);
    if (!record) return { success: false, message: 'Record not found.' };

    record.internalNotes.unshift({
      id: `note-${Date.now()}`,
      note,
      author,
      createdAt: new Date().toLocaleString(),
    });
    record.updatedAt = new Date().toLocaleString();

    return { success: true, message: 'Ops internal note added.' };
  },

  // Simulate Courier Reweigh Audit Import
  simulateCourierAudit: (auditInput: {
    shipmentId: string;
    awbNumber: string;
    orderId: string;
    merchantName: string;
    courierName: string;
    bookedWeightKg: number;
    auditedWeightKg: number;
    additionalChargeINR: number;
    isPackageLevel?: boolean;
  }): WeightDiscrepancyRecord => {
    const nextNum = DISCREPANCY_STORE.length + 1;
    const discId = `WD-20260829-${String(nextNum).padStart(3, '0')}`;
    const diff = Math.max(0, auditInput.auditedWeightKg - auditInput.bookedWeightKg);

    const newRecord: WeightDiscrepancyRecord = {
      id: `wd-rec-${Date.now()}`,
      discrepancyId: discId,
      shipmentId: auditInput.shipmentId,
      awbNumber: auditInput.awbNumber,
      lrnNumber: `LRN-${auditInput.awbNumber.slice(-5)}`,
      orderId: auditInput.orderId,
      tenantId: 'tenant-demo-01',
      merchantName: auditInput.merchantName,
      merchantCompany: `${auditInput.merchantName} Private Limited`,
      pickupWarehouse: 'Bhiwandi Main Hub',
      destinationCity: 'Mumbai Metro',

      bookedSnapshot: {
        actualWeightKg: auditInput.bookedWeightKg,
        lengthCm: 25,
        widthCm: 20,
        heightCm: 15,
        volumetricWeightKg: auditInput.bookedWeightKg * 0.8,
        chargeableWeightKg: auditInput.bookedWeightKg,
        appliedRateCardId: 'RC-STD-2026',
        appliedRateCardName: 'Standard Logistics Rate Card',
        appliedFreightINR: auditInput.bookedWeightKg * 40,
        appliedAdditionalChargesINR: 20,
        appliedGstINR: auditInput.bookedWeightKg * 7.2,
        finalShipmentChargeINR: auditInput.bookedWeightKg * 47.2,
      },

      courierAudit: {
        auditDate: new Date().toISOString().split('T')[0],
        auditTime: new Date().toLocaleTimeString(),
        courierId: auditInput.courierName.toLowerCase().replace(/\s+/g, ''),
        courierName: auditInput.courierName,
        courierAwb: auditInput.awbNumber,
        auditedActualWeightKg: auditInput.auditedWeightKg,
        auditedLengthCm: 35,
        auditedWidthCm: 28,
        auditedHeightCm: 20,
        auditedVolumetricWeightKg: auditInput.auditedWeightKg * 0.9,
        auditedChargeableWeightKg: auditInput.auditedWeightKg,
        auditSource: 'HUB_SCAN',
        courierDiscrepancyRef: `AUD-${Date.now()}`,
        isPackageLevel: auditInput.isPackageLevel || false,
      },

      weightDiffKg: diff,
      additionalChargeINR: auditInput.additionalChargeINR,
      financialImpact: {
        originalFreightChargeINR: auditInput.bookedWeightKg * 40,
        additionalChargeINR: auditInput.additionalChargeINR,
        disputedAmountINR: auditInput.additionalChargeINR,
        approvedRefundINR: 0,
        finalAdjustedChargeINR: auditInput.bookedWeightKg * 40 + auditInput.additionalChargeINR,
      },
      discrepancyNoticeDate: new Date().toLocaleString(),
      disputeDeadline: getDeadlineDate(DISPUTE_CONFIG.defaultWindowDays),
      status: 'SUBMITTED',

      proofAttachments: [],
      internalNotes: [
        {
          id: `note-init-${Date.now()}`,
          note: `Courier reweigh audit detected: ${auditInput.auditedWeightKg} KG vs ${auditInput.bookedWeightKg} KG Booked.`,
          author: 'Automated Courier API',
          createdAt: new Date().toLocaleString(),
        },
      ],
      walletLedgerDebitRef: `tx-wd-debit-${Date.now()}`,
      refundCreditINR: 0,
      auditTimeline: [
        {
          id: `evt-init-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          event: `Courier Reweigh Scan Received (${auditInput.auditedWeightKg} KG)`,
          actor: `${auditInput.courierName} Scanner`,
          role: 'COURIER_SYSTEM',
          status: 'SUBMITTED',
          notes: `Diff: +${diff} KG, Additional Charge: ₹${auditInput.additionalChargeINR}`,
        },
      ],

      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    };

    WalletService.withdraw(
      auditInput.additionalChargeINR,
      `Weight Adjustment Debit (${discId} • AWB ${auditInput.awbNumber})`
    );

    // Emit Realtime Bell & Toast Notification
    RealtimeNotificationService.triggerEvent({
      tenantId: 'tenant-demo-01',
      eventType: 'WEIGHT_DISCREPANCY',
      category: 'Finance',
      priority: 'HIGH',
      title: `Weight discrepancy detected on AWB ${auditInput.awbNumber}`,
      message: `Additional ₹${auditInput.additionalChargeINR} charged by courier (${auditInput.auditedWeightKg} KG vs ${auditInput.bookedWeightKg} KG Booked).`,
      awbNumber: auditInput.awbNumber,
      orderId: auditInput.orderId,
    });

    DISCREPANCY_STORE.unshift(newRecord);
    return newRecord;
  },
};
