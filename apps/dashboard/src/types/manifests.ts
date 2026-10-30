import type { StatusType } from './component';

export type ManifestStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'HANDED_OVER'
  | 'CLOSED'
  | 'CANCELLED';

export interface ManifestStatusConfig {
  key: ManifestStatus;
  label: string;
  variant: StatusType;
}

export const MANIFEST_STATUS_CONFIG: ManifestStatusConfig[] = [
  { key: 'DRAFT', label: 'Draft', variant: 'neutral' },
  { key: 'GENERATED', label: 'Manifest Generated', variant: 'info' },
  { key: 'HANDED_OVER', label: 'Handed Over to Courier', variant: 'success' },
  { key: 'CLOSED', label: 'Closed', variant: 'neutral' },
  { key: 'CANCELLED', label: 'Cancelled', variant: 'danger' },
];

export interface ManifestItem {
  shipmentId: string;
  orderRef: string;
  awb: string;
  recipientName: string;
  recipientCity: string;
  packageCount: number;
  weightGrams: number;
  paymentMode: 'PREPAID' | 'COD';
  codAmountMinor: number;
}

export interface Manifest extends Record<string, unknown> {
  id: string;
  tenantId: string;
  pickupRequestId: string;
  courierId: string;
  courierName: string;
  warehouseId: string;
  warehouseName: string;
  manifestNumber: string;
  shipmentIds: string[];
  items: ManifestItem[];
  shipmentCount: number;
  totalPackages: number;
  totalWeightGrams: number;
  totalCodAmountMinor: number;
  status: ManifestStatus;
  generatedAt: string;
  handedOverAt?: string;
  handoverBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
