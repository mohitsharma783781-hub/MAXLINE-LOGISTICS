import type { StatusType } from './component';

export type CourierConnectionStatus =
  | 'not_connected'
  | 'connecting'
  | 'connected'
  | 'auth_failed'
  | 'disabled'
  | 'error';

export type CourierType = 'CARRIER' | 'AGGREGATOR';

export type CourierIntegrationStatus = 'NOT_CONNECTED' | 'CONNECTED' | 'ERROR' | 'TESTING';

export type CourierServiceType = 'surface' | 'express' | 'air' | 'hyperlocal' | 'STANDARD' | 'EXPRESS' | 'PREMIUM' | 'ECONOMY' | 'SAME_DAY' | 'NEXT_DAY';

export type TransportMode = 'SURFACE' | 'AIR' | 'RAIL' | 'MULTIMODAL';

export type DeliveryType = 'B2C' | 'B2B' | 'BOTH';

export type CapabilityType =
  | 'RATE'
  | 'SERVICEABILITY'
  | 'BOOKING'
  | 'AWB'
  | 'LABEL'
  | 'PICKUP'
  | 'TRACKING'
  | 'NDR'
  | 'RTO'
  | 'CANCEL'
  | 'COD'
  | 'REATTEMPT'
  | 'MANIFEST';

export type CourierCode =
  | 'DELHIVERY'
  | 'DTDC'
  | 'BLUE_DART'
  | 'XPRESSBEES'
  | 'ECOM_EXPRESS'
  | 'EKART'
  | 'SHADOWFAX'
  | string;

export interface CourierStatusConfig {
  key: CourierConnectionStatus;
  label: string;
  variant: StatusType;
}

export const COURIER_STATUS_CONFIG: CourierStatusConfig[] = [
  { key: 'not_connected', label: 'Not Connected', variant: 'neutral' },
  { key: 'connecting', label: 'Connecting...', variant: 'info' },
  { key: 'connected', label: 'Connected', variant: 'success' },
  { key: 'auth_failed', label: 'Auth Failed', variant: 'danger' },
  { key: 'disabled', label: 'Disabled', variant: 'warning' },
  { key: 'error', label: 'Connection Error', variant: 'danger' },
];

export interface AuthenticationField {
  key: string;
  label: string;
  type: 'text' | 'password';
  required: boolean;
  secret: boolean;
}

export interface CourierCapability {
  serviceTypes: CourierServiceType[];
  paymentModes: ('prepaid' | 'cod' | 'PREPAID' | 'COD')[];
  maxWeightKg: number;
  codSupported: boolean;
  prepaidSupported: boolean;
  trackingSupported: boolean;
  labelSupported: boolean;
  pickupSupported: boolean;
  serviceabilitySupported: boolean;
  supportedCapabilities?: CapabilityType[];
}

export interface CourierProvider extends Record<string, unknown> {
  id: string;
  code: string;
  name: string;
  displayName: string;
  logo?: string;
  type?: CourierType;
  integrationType: 'API' | 'Webhook' | 'OAuth';
  supportedModes: ('B2C' | 'B2B')[];
  serviceTypes: CourierServiceType[];
  authSchema: AuthenticationField[];
  capabilities: CourierCapability;
  description: string;
  adapterType: 'DEMO' | 'NATIVE';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  integrationStatus?: CourierIntegrationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourierConnectionForm {
  courierId: string;
  credentials: Record<string, string>;
  accountId: string;
  defaultWarehouseId: string;
  defaultService: CourierServiceType;
  enabledServices: CourierServiceType[];
}

export interface CourierServiceItem extends Record<string, unknown> {
  id: string;
  courierId: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  serviceType: CourierServiceType;
  mode: TransportMode;
  deliveryType: DeliveryType;
  paymentModes: ('PREPAID' | 'COD')[];
  enabled: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  capabilities: CapabilityType[];
  createdAt: string;
  updatedAt: string;
}

export interface CourierAccountService extends Record<string, unknown> {
  id: string;
  courierAccountId: string;
  courierId: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  deliveryType: DeliveryType;
  status: 'ACTIVE' | 'INACTIVE';
  priority: number;
  isDefaultB2C?: boolean;
  isDefaultB2B?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourierCredential {
  id: string;
  tenantId: string;
  courierId: string;
  credentialType: 'API_KEY' | 'USERNAME_PASSWORD' | 'TOKEN' | 'ACCOUNT_ID' | 'CLIENT_ID_SECRET';
  status: 'ACTIVE' | 'INACTIVE' | 'INVALID';
  maskedIdentifier: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourierHealth {
  courierId: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';
  checkedAt: string;
  responseTimeMs: number;
  message: string;
}

export interface CourierActivityLog extends Record<string, unknown> {
  id: string;
  tenantId: string;
  courierId: string;
  action: 'RATE_CHECK' | 'SERVICEABILITY_CHECK' | 'BOOKING' | 'TRACKING' | 'LABEL' | 'PICKUP' | 'NDR' | 'RTO';
  status: 'SUCCESS' | 'FAILED';
  referenceType: string;
  referenceId: string;
  message: string;
  createdAt: string;
}

export interface CourierAccount extends Record<string, unknown> {
  id: string;
  tenantId: string;
  courierId: string;
  accountName: string;
  accountCode: string;
  accountType: 'PLATFORM' | 'MERCHANT';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'SUSPENDED';
  mode: 'B2C' | 'B2B' | 'BOTH';
  environment: 'SANDBOX' | 'PRODUCTION';
  priority: number;
  isDefault: boolean;
  credentialsReference: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourierConnection extends Record<string, unknown> {
  id: string;
  courierId: string;
  courierName: string;
  displayName: string;
  status: CourierConnectionStatus;
  statusText: string;
  accountId?: string;
  warehouseId?: string;
  lastSync: string;
  enabledServices: CourierServiceType[];
  capabilities: CourierCapability;
  createdAt: string;
}

export interface CourierFilterState {
  searchQuery: string;
  status: string;
  serviceType: string;
}

// Normalized Universal Integration Response Models
export interface NormalizedRate {
  success: boolean;
  courierCode: CourierCode;
  serviceCode: string;
  amount: number;
  currency: 'INR';
  estimatedDeliveryDays: number;
  metadata?: Record<string, unknown>;
}

export interface NormalizedServiceabilityResult {
  success: boolean;
  serviceable: boolean;
  courierCode: CourierCode;
  serviceCode: string;
  estimatedDeliveryDays: number;
  reason?: string;
}

export interface NormalizedBookingResult {
  success: boolean;
  courierCode: CourierCode;
  shipmentReference: string;
  awb: string;
  status: string;
  error?: string;
}

export interface NormalizedTrackingResult {
  success: boolean;
  courierCode: CourierCode;
  awb: string;
  status: string;
  events: Array<{ status: string; description: string; eventTime: string; location: string }>;
  error?: string;
}

export interface UniversalAdapterError {
  code:
    | 'AUTHENTICATION_FAILED'
    | 'INVALID_REQUEST'
    | 'SERVICE_UNAVAILABLE'
    | 'RATE_NOT_FOUND'
    | 'NOT_SERVICEABLE'
    | 'BOOKING_FAILED'
    | 'AWB_GENERATION_FAILED'
    | 'LABEL_GENERATION_FAILED'
    | 'TRACKING_FAILED'
    | 'CAPABILITY_NOT_SUPPORTED'
    | 'COURIER_ADAPTER_NOT_FOUND'
    | 'UNKNOWN_ERROR';
  message: string;
  provider?: string;
}
