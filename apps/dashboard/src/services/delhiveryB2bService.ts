/**
 * MAXLINE LOGISTICS - Delhivery B2B Client Service
 * Interacts with Delhivery B2B API gateway via MAXLINE's unified serverless backend.
 * Enforces 10 CFT volumetric density and 20 KG minimum billing slab.
 */

import {
  calculate10CftBoxVolumetricKg,
  computeB2B10CftConsignment,
  B2B_10CFT_CONFIG,
} from '../utils/b2bDimensions';

export interface B2BBoxDimension {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeightKg: number;
  boxCount: number;
}

export interface B2BManifestParams {
  orderId: string;
  ewayBillNumber?: string;
  invoiceNumber?: string;
  invoiceValueINR?: number;
  consigneeName: string;
  consigneePhone: string;
  consigneeGstin?: string;
  consigneeAddress: string;
  consigneeCity: string;
  consigneeState: string;
  consigneePincode: string | number;
  boxes: B2BBoxDimension[];
  pickupWarehouse?: string;
  paymentMode?: 'Prepaid' | 'COD';
  codAmount?: number;
}

export class DelhiveryB2bService {
  private static readonly CLIENT_NAME = 'AJAYKUMAR10RPB2BRC-B2B';
  private static readonly DEFAULT_WAREHOUSE = 'AJAYKUMAR10RP B2BRC';
  private static readonly MIN_SLAB_KG = B2B_10CFT_CONFIG.MIN_SLAB_KG; // 20 KG MINIMUM SLAB
  private static readonly CFT_DIVISOR = B2B_10CFT_CONFIG.CFT_DIVISOR_CM3;
  private static readonly CFT_MULTIPLIER = B2B_10CFT_CONFIG.CFT_WEIGHT_FACTOR_KG;

  /**
   * Calculate 10 CFT Volumetric Weight in KG using shared authoritative formula:
   * (L * W * H / 27000) * 10 = (L * W * H / 2700)
   */
  public static calculate10CftVolumetricKg(lengthCm: number, widthCm: number, heightCm: number): number {
    return calculate10CftBoxVolumetricKg(lengthCm, widthCm, heightCm);
  }

  /**
   * Calculate Total Chargeable Weight applying 20 KG Minimum Slab across multiple boxes
   */
  public static computeConsignmentWeights(boxes: B2BBoxDimension[]) {
    const summary = computeB2B10CftConsignment(boxes);
    return {
      totalPieces: summary.totalBoxes,
      totalActualKg: summary.totalActualWeightKg,
      totalVolumetricKg: summary.totalVolumetricWeightKg,
      minSlabKg: summary.minSlabKg,
      chargeableWeightKg: summary.chargeableWeightKg,
      rawChargeableWeightKg: summary.rawChargeableWeightKg,
      isMinSlabApplied: summary.isMinSlabApplied,
    };
  }

  /**
   * Authenticate with Delhivery B2B Staging/Production gateway
   */
  public static async login(password?: string) {
    try {
      const res = await fetch('/api/delhivery?action=b2b-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.CLIENT_NAME,
          password: password || undefined,
        }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error connecting to B2B login service' };
    }
  }

  /**
   * Manifest a B2B Shipment (Generate LR)
   */
  public static async manifest(params: B2BManifestParams, token?: string) {
    try {
      const res = await fetch('/api/delhivery?action=b2b-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          pickupWarehouse: params.pickupWarehouse || undefined,
          token,
        }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error manifesting B2B shipment' };
    }
  }

  /**
   * Track a B2B LR Number
   */
  public static async track(lrNumber: string, token?: string) {
    try {
      const res = await fetch(
        `/api/delhivery?action=b2b-track&lrNumber=${encodeURIComponent(lrNumber)}${token ? `&token=${encodeURIComponent(token)}` : ''}`
      );
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error tracking B2B LR' };
    }
  }

  /**
   * Request B2B Commercial Freight Pickup
   */
  public static async requestPickup(params: {
    pickupWarehouse?: string;
    pickupDate: string;
    pickupTime?: string;
    expectedPackageCount: number;
    totalWeightKg?: number;
    consignments?: string[];
    contactPerson?: string;
    contactPhone?: string;
    vehicleType?: string;
    specialInstructions?: string;
    token?: string;
  }) {
    try {
      const token = params.token || (await this.login()).token;
      const res = await fetch('/api/delhivery?action=b2b-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupWarehouse: params.pickupWarehouse || undefined,
          pickupDate: params.pickupDate,
          pickupTime: params.pickupTime,
          expectedPackageCount: params.expectedPackageCount,
          totalWeightKg: params.totalWeightKg,
          consignments: params.consignments || [],
          contactPerson: params.contactPerson,
          contactPhone: params.contactPhone,
          vehicleType: params.vehicleType,
          specialInstructions: params.specialInstructions,
          token,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || !data?.pickupId) {
        return {
          success: false,
          status: 'FAILED',
          message: data?.message || `Delhivery B2B pickup scheduling rejected (HTTP ${res.status}).`,
          details: data,
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        status: 'FAILED',
        message: err.message || 'Network exception while scheduling Delhivery B2B pickup.',
      };
    }
  }
}
