import type { PaymentMode, ShipmentType, ServiceType } from './rates';

export type AllocationMode = 'MANUAL' | 'AUTOMATIC';
export type DefaultAllocationStrategy =
  | 'BALANCED'
  | 'LOWEST_COST'
  | 'FASTEST'
  | 'PREFERRED_COURIER'
  | 'CUSTOM';

export type ConditionField =
  | 'paymentMode'
  | 'actualWeight'
  | 'originPincode'
  | 'destinationPincode'
  | 'shipmentType'
  | 'serviceType'
  | 'declaredValue'
  | 'estimatedDays';

export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'contains'
  | 'in';

export type ActionType =
  | 'PREFER_COURIER'
  | 'EXCLUDE_COURIER'
  | 'PREFER_SERVICE'
  | 'SET_MAX_COST'
  | 'SET_MAX_ETA'
  | 'PREFER_COD_SUPPORT';

export interface RuleCondition {
  field: ConditionField;
  operator: ConditionOperator;
  value: string | number;
}

export interface RuleAction {
  type: ActionType;
  value: string | number;
}

export interface AllocationRule {
  id: string;
  name: string;
  description?: string;
  priority: number; // lower number = higher priority
  status: 'ACTIVE' | 'INACTIVE';
  conditions: RuleCondition[];
  actions: RuleAction[];
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AllocationEngineInput {
  originPincode: string;
  destinationPincode: string;
  actualWeight: number;
  length?: number;
  width?: number;
  height?: number;
  packageCount?: number;
  paymentMode: PaymentMode;
  shipmentType: ShipmentType;
  serviceType?: ServiceType;
  declaredValue?: number;
  preferredCourierId?: string;
  tenantId?: string;
}

export interface EligibleCourierResult {
  courierId: string;
  courierName: string;
  courierLogo: string;
  serviceId: string;
  serviceName: string;
  serviceType: 'Surface' | 'Express' | 'Air';
  totalCost: number;
  etaDaysMin: number;
  etaDaysMax: number;
  estimatedDays: string;
  codSupported: boolean;
  score: number; // 0-100 score
  scoreBreakdown: {
    costScore: number;
    speedScore: number;
    ruleBonus: number;
    preferenceBonus: number;
  };
}

export interface ExcludedCourierResult {
  courierId: string;
  courierName: string;
  courierLogo: string;
  serviceName: string;
  reason: string;
}

export interface AllocationEvaluationResult {
  recommendedCourier: EligibleCourierResult | null;
  recommendationReason: string;
  strategyUsed: DefaultAllocationStrategy;
  eligibleCouriers: EligibleCourierResult[];
  excludedCouriers: ExcludedCourierResult[];
  appliedRules: AllocationRule[];
  overrideCourierId?: string | null;
  isOverridden?: boolean;
}
