import type { StatusType } from './component';

// --- LABEL TYPES ---
export type LabelStatus = 'NOT_GENERATED' | 'GENERATING' | 'GENERATED' | 'FAILED';
export type LabelFormat = 'PDF' | 'PNG';
export type LabelSize = 'A4' | '4x6';

export interface LabelStatusConfig {
  key: LabelStatus;
  label: string;
  variant: StatusType;
  description: string;
}

export const LABEL_STATUS_CONFIG: LabelStatusConfig[] = [
  { key: 'NOT_GENERATED', label: 'Not Generated', variant: 'neutral', description: 'Label has not been generated yet' },
  { key: 'GENERATING', label: 'Generating...', variant: 'warning', description: 'Label generation in progress' },
  { key: 'GENERATED', label: 'Generated', variant: 'success', description: 'Demo label generated successfully' },
  { key: 'FAILED', label: 'Generation Failed', variant: 'danger', description: 'Label generation failed' },
];

export interface ShippingLabelItem extends Record<string, unknown> {
  id: string;
  shipmentId: string;
  orderId: string;
  courierId: string;
  courierName: string;
  courierLogo?: string;
  awb: string;
  status: LabelStatus;
  format: LabelFormat;
  size: LabelSize;
  labelReference: string;
  labelUrl?: string;
  originPincode: string;
  destinationPincode: string;
  destinationCity: string;
  weightKg: number;
  paymentMode: 'PREPAID' | 'COD';
  codAmount?: number;
  generatedAt?: string;
  failureReason?: string;
  tenantId?: string;
}

export interface LabelFilterState {
  searchQuery: string;
  status: string;
  courier: string;
  format: string;
}

export interface BulkLabelRequest {
  shipmentIds: string[];
  format: LabelFormat;
  size: LabelSize;
}

export interface BulkLabelResult {
  generatedCount: number;
  failedCount: number;
  skippedCount: number;
  results: Array<{
    shipmentId: string;
    success: boolean;
    labelReference?: string;
    failureReason?: string;
  }>;
}

// --- MANIFEST TYPES ---
export type ManifestStatus = 'DRAFT' | 'READY' | 'CLOSED' | 'HANDED_OVER' | 'CANCELLED';

export interface ManifestStatusConfig {
  key: ManifestStatus;
  label: string;
  variant: StatusType;
  description: string;
}

export const MANIFEST_STATUS_CONFIG: ManifestStatusConfig[] = [
  { key: 'DRAFT', label: 'Draft', variant: 'neutral', description: 'Manifest created, shipments can be added or removed' },
  { key: 'READY', label: 'Ready for Close', variant: 'info', description: 'Shipments verified, ready to close' },
  { key: 'CLOSED', label: 'Manifest Closed', variant: 'warning', description: 'Manifest locked, ready for courier handover' },
  { key: 'HANDED_OVER', label: 'Handed Over', variant: 'success', description: 'Parcels handed over to courier pickup executive' },
  { key: 'CANCELLED', label: 'Cancelled', variant: 'neutral', description: 'Manifest voided' },
];

export interface ManifestEvent {
  id: string;
  manifestId: string;
  status: ManifestStatus;
  title: string;
  description: string;
  timestamp: string;
}

export interface ManifestItem extends Record<string, unknown> {
  id: string;
  manifestNumber: string;
  manifestReference: string;
  courierId: string;
  courierName: string;
  warehouseId: string;
  warehouseName: string;
  warehouseAddress: string;
  shipmentIds: string[];
  shipmentCount: number;
  totalWeightKg: number;
  status: ManifestStatus;
  statusText: string;
  createdAt: string;
  closedAt?: string;
  handedOverAt?: string;
  events: ManifestEvent[];
  tenantId?: string;
}

export interface ManifestFilterState {
  searchQuery: string;
  status: string;
  warehouse: string;
  courier: string;
}

export interface CreateManifestInput {
  warehouseId: string;
  courierId: string;
  shipmentIds: string[];
  tenantId?: string;
}

export interface CreateManifestResponse {
  success: boolean;
  manifestReference: string;
  status: ManifestStatus;
  failureReason?: string;
  manifest?: ManifestItem;
}
