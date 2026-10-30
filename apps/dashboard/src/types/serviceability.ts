export type ServiceabilityMode = 'B2C' | 'B2B';
export type PaymentCapability = 'PREPAID' | 'COD' | 'BOTH';

export interface PinMasterItem extends Record<string, unknown> {
  id: string;
  country: string;
  postalCode: string;
  city: string;
  district: string;
  state: string;
  stateCode: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface ZoneScheme extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  courierId: string;
  courierName: string;
  courierAccountId?: string;
  serviceId?: string;
  serviceCode?: string;
  mode: ServiceabilityMode;
  version: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface CourierZone extends Record<string, unknown> {
  id: string;
  schemeId: string;
  code: string; // e.g. N1, N2, W1, W2, E1, S1
  name: string; // e.g. North Zone 1
  pinCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface ZoneMappingItem extends Record<string, unknown> {
  id: string;
  schemeId: string;
  zoneId: string;
  zoneCode: string;
  postalCode: string;
  courierId: string;
  courierAccountId?: string;
  serviceId?: string;
  mode: ServiceabilityMode;
  forward: boolean;
  cod: boolean;
  prepaid: boolean;
  pickup: boolean;
  rto: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export type ServiceabilityReasonCode =
  | 'SERVICEABLE'
  | 'PIN_NOT_FOUND'
  | 'COURIER_NOT_CONFIGURED'
  | 'SERVICE_NOT_CONFIGURED'
  | 'ZONE_NOT_FOUND'
  | 'NOT_SERVICEABLE'
  | 'COD_NOT_AVAILABLE'
  | 'PREPAID_NOT_AVAILABLE'
  | 'ACCOUNT_INACTIVE'
  | 'SERVICE_INACTIVE'
  | 'PIN_INACTIVE';

export interface ServiceabilityCheckInput {
  originPostalCode: string;
  destinationPostalCode: string;
  courierId?: string;
  courierAccountId?: string;
  serviceId?: string;
  mode: ServiceabilityMode;
  paymentMode: 'PREPAID' | 'COD';
  tenantId?: string;
}

export interface ServiceabilityResultItem extends Record<string, unknown> {
  courierId: string;
  courierCode: string;
  courierName: string;
  courierLogo?: string;
  courierAccountId?: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  mode: ServiceabilityMode;
  transportMode: string;
  serviceable: boolean;
  originZone?: string;
  destinationZone?: string;
  forward: boolean;
  cod: boolean;
  prepaid: boolean;
  pickup: boolean;
  reasonCode: ServiceabilityReasonCode;
  reasonMessage: string;
}

export interface ServiceabilityImportRow extends Record<string, unknown> {
  rowNumber: number;
  courierCode: string;
  accountCode?: string;
  serviceCode: string;
  mode: ServiceabilityMode;
  zoneCode: string;
  postalCode: string;
  forward: boolean;
  cod: boolean;
  prepaid: boolean;
  pickup: boolean;
  isValid: boolean;
  errorReason?: string;
}

export interface ServiceabilityImportLog extends Record<string, unknown> {
  id: string;
  filename: string;
  courierId: string;
  courierName: string;
  serviceId?: string;
  mode: ServiceabilityMode;
  uploadedBy: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  newRows: number;
  updatedRows: number;
  status: 'DRAFT' | 'VALIDATED' | 'PUBLISHED' | 'FAILED';
  createdAt: string;
}
