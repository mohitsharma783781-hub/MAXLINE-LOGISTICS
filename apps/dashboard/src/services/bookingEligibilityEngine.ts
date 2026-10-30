import { CustomerRateAssignmentService, type EligibleCourierResult } from './customerRateAssignmentService';
import { CourierMasterService } from './courierMasterService';

export interface BookingEligibilityInput extends Record<string, unknown> {
  tenantId: string;
  mode: 'B2B' | 'B2C';
  originPincode: string;
  destinationPincode: string;
  totalWeightKg: number;
  paymentType: 'PREPAID' | 'COD';
  codAmountINR?: number;
  packageCount: number;
}

export interface EligibilityCheckDetail extends Record<string, unknown> {
  courierId: string;
  courierName: string;
  customerAccessPass: boolean;
  courierActivePass: boolean;
  serviceActivePass: boolean;
  pickupServiceablePass: boolean;
  deliveryServiceablePass: boolean;
  modeMatchPass: boolean;
  codSupportedPass: boolean;
  multiPackagePass: boolean;
  rateConfiguredPass: boolean;
  isOverallEligible: boolean;
  disqualificationReason?: string;
}

export const BookingEligibilityEngine = {
  // Centralized Function: getAvailableServices()
  getAvailableServices: (input: BookingEligibilityInput): EligibleCourierResult[] => {
    const weightGrams = Math.round(input.totalWeightKg * 1000);
    const codPaise = (input.codAmountINR || 0) * 100;

    // Fetch base options from rate assignment engine
    const candidates = CustomerRateAssignmentService.getEligibleCouriersForCustomer(
      input.tenantId,
      input.mode,
      input.originPincode,
      input.destinationPincode,
      weightGrams,
      input.paymentType,
      codPaise
    );

    // Apply strict 9-point eligibility filters
    return candidates.filter((cand) => {
      const courierMaster = CourierMasterService.getCourierById(cand.courierId);
      if (!courierMaster || courierMaster.status !== 'ACTIVE') return false;

      if (input.mode === 'B2B' && !courierMaster.b2bEnabled) return false;
      if (input.mode === 'B2C' && !courierMaster.b2cEnabled) return false;

      if (input.paymentType === 'COD' && !courierMaster.codEnabled) return false;
      if (input.packageCount > 1 && !courierMaster.multiPackageEnabled) return false;

      if (!cand.serviceable || cand.customerPriceINR <= 0) return false;

      return true;
    });
  },

  // Admin Debug Diagnostic Tool: explainCourierEligibility()
  explainCourierEligibility: (input: BookingEligibilityInput): EligibilityCheckDetail[] => {
    const couriers = CourierMasterService.getCouriers();

    return couriers.map((c) => {
      const activeAssignments = CustomerRateAssignmentService.getAssignments(input.tenantId, input.mode);
      const assignment = activeAssignments.find((a) => a.courierId === c.courierId && a.status === 'ACTIVE');

      const customerAccessPass = !!assignment;
      const courierActivePass = c.status === 'ACTIVE';
      const serviceActivePass = true;
      const pickupServiceablePass = true;
      const deliveryServiceablePass = true;
      const modeMatchPass = input.mode === 'B2B' ? c.b2bEnabled : c.b2cEnabled;
      const codSupportedPass = input.paymentType !== 'COD' || c.codEnabled;
      const multiPackagePass = input.packageCount <= 1 || c.multiPackageEnabled;
      const rateConfiguredPass = !!assignment;

      const isOverallEligible =
        customerAccessPass &&
        courierActivePass &&
        serviceActivePass &&
        pickupServiceablePass &&
        deliveryServiceablePass &&
        modeMatchPass &&
        codSupportedPass &&
        multiPackagePass &&
        rateConfiguredPass;

      let disqualificationReason = 'Eligible for customer booking';
      if (!customerAccessPass) disqualificationReason = 'Customer not authorized for this courier card';
      else if (!courierActivePass) disqualificationReason = 'Courier partner is INACTIVE';
      else if (!modeMatchPass) disqualificationReason = `${input.mode} mode is disabled for courier`;
      else if (!codSupportedPass) disqualificationReason = 'COD payment unsupported by courier';
      else if (!multiPackagePass) disqualificationReason = 'Multi-package shipping unsupported by courier';

      return {
        courierId: c.courierId,
        courierName: c.courierName,
        customerAccessPass,
        courierActivePass,
        serviceActivePass,
        pickupServiceablePass,
        deliveryServiceablePass,
        modeMatchPass,
        codSupportedPass,
        multiPackagePass,
        rateConfiguredPass,
        isOverallEligible,
        disqualificationReason,
      };
    });
  },
};
