export interface PaymentOrderInput extends Record<string, unknown> {
  rechargeId: string;
  amountINR: number;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface PaymentOrderResult extends Record<string, unknown> {
  success: boolean;
  rechargeId: string;
  providerPaymentId: string;
  amountINR: number;
  currency: string;
  checkoutUrl?: string;
  message?: string;
}

export interface PaymentVerificationInput extends Record<string, unknown> {
  rechargeId: string;
  providerPaymentId: string;
  rawSignature: string;
  actualPaidAmountINR?: number;
}

export interface PaymentVerificationResult extends Record<string, unknown> {
  verified: boolean;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'AMOUNT_MISMATCH';
  rechargeId: string;
  providerPaymentId: string;
  amountINR: number;
  reasonMessage: string;
}

export interface PaymentProviderAdapter {
  providerId: string;
  providerName: string;
  createPaymentOrder: (input: PaymentOrderInput) => Promise<PaymentOrderResult>;
  verifyPaymentSignature: (input: PaymentVerificationInput) => Promise<PaymentVerificationResult>;
  handleWebhook: (payload: Record<string, unknown>, signature: string) => Promise<PaymentVerificationResult>;
  processRefund: (input: { paymentId: string; amountINR: number; reason: string }) => Promise<{ success: boolean; refundRef: string }>;
}

// 1. Development Mock Gateway Adapter
export const MockPaymentGatewayAdapter: PaymentProviderAdapter = {
  providerId: 'mock-payment-gateway',
  providerName: '[DEVELOPMENT / MOCK] Payment Gateway Adapter',

  createPaymentOrder: async (input) => {
    return {
      success: true,
      rechargeId: input.rechargeId,
      providerPaymentId: `PAY-MOCK-${Math.floor(10000000 + Math.random() * 90000000)}`,
      amountINR: input.amountINR,
      currency: 'INR',
      checkoutUrl: `/app/wallet/checkout/${input.rechargeId}`,
      message: 'Mock payment order generated for development testing.',
    };
  },

  verifyPaymentSignature: async (input) => {
    const { rechargeId, providerPaymentId, rawSignature, actualPaidAmountINR } = input;

    if (rawSignature === 'SIMULATE_FAILED') {
      return {
        verified: false,
        status: 'FAILED',
        rechargeId,
        providerPaymentId,
        amountINR: actualPaidAmountINR || 1000,
        reasonMessage: 'Simulated payment authorization decline from mock bank gateway.',
      };
    }

    if (rawSignature === 'SIMULATE_PENDING') {
      return {
        verified: false,
        status: 'PENDING',
        rechargeId,
        providerPaymentId,
        amountINR: actualPaidAmountINR || 1000,
        reasonMessage: 'Payment transaction status is pending bank settlement.',
      };
    }

    if (rawSignature === 'SIMULATE_MISMATCH') {
      return {
        verified: false,
        status: 'AMOUNT_MISMATCH',
        rechargeId,
        providerPaymentId,
        amountINR: (actualPaidAmountINR || 1000) * 0.9,
        reasonMessage: 'Security Alert: Paid amount does not match expected recharge order amount.',
      };
    }

    return {
      verified: true,
      status: 'SUCCESS',
      rechargeId,
      providerPaymentId,
      amountINR: actualPaidAmountINR || 1000,
      reasonMessage: 'Payment signature verified successfully server-side.',
    };
  },

  handleWebhook: async (payload, signature) => {
    const rechargeId = (payload.rechargeId as string) || 'RCH-MOCK-001';
    const providerPaymentId = (payload.providerPaymentId as string) || 'PAY-MOCK-WH-101';
    const amountINR = (payload.amountINR as number) || 1000;

    return MockPaymentGatewayAdapter.verifyPaymentSignature({
      rechargeId,
      providerPaymentId,
      rawSignature: signature,
      actualPaidAmountINR: amountINR,
    });
  },

  processRefund: async () => ({
    success: true,
    refundRef: `RFD-MOCK-${Date.now()}`,
  }),
};

// 2. Razorpay Placeholder Adapter
export const RazorpayAdapter: PaymentProviderAdapter = {
  providerId: 'razorpay',
  providerName: 'Razorpay Gateway Adapter',
  createPaymentOrder: async (input) => ({ success: true, rechargeId: input.rechargeId, providerPaymentId: `rzp_${Date.now()}`, amountINR: input.amountINR, currency: 'INR' }),
  verifyPaymentSignature: async (input) => ({ verified: false, status: 'FAILED', rechargeId: input.rechargeId, providerPaymentId: input.providerPaymentId, amountINR: input.actualPaidAmountINR || 0, reasonMessage: 'Razorpay API credentials not configured.' }),
  handleWebhook: async (payload) => ({ verified: false, status: 'FAILED', rechargeId: (payload.rechargeId as string) || 'RCH-1', providerPaymentId: 'RZP-WH', amountINR: 0, reasonMessage: 'Razorpay webhook signature verification unconfigured.' }),
  processRefund: async () => ({ success: true, refundRef: `RFD-RZP-${Date.now()}` }),
};

// 3. Cashfree Placeholder Adapter
export const CashfreeAdapter: PaymentProviderAdapter = {
  providerId: 'cashfree',
  providerName: 'Cashfree Payments Adapter',
  createPaymentOrder: async (input) => ({ success: true, rechargeId: input.rechargeId, providerPaymentId: `cf_${Date.now()}`, amountINR: input.amountINR, currency: 'INR' }),
  verifyPaymentSignature: async (input) => ({ verified: false, status: 'FAILED', rechargeId: input.rechargeId, providerPaymentId: input.providerPaymentId, amountINR: input.actualPaidAmountINR || 0, reasonMessage: 'Cashfree API credentials not configured.' }),
  handleWebhook: async (payload) => ({ verified: false, status: 'FAILED', rechargeId: (payload.rechargeId as string) || 'RCH-1', providerPaymentId: 'CF-WH', amountINR: 0, reasonMessage: 'Cashfree webhook signature verification unconfigured.' }),
  processRefund: async () => ({ success: true, refundRef: `RFD-CF-${Date.now()}` }),
};

// 4. PhonePe Placeholder Adapter
export const PhonePeAdapter: PaymentProviderAdapter = {
  providerId: 'phonepe',
  providerName: 'PhonePe PG Adapter',
  createPaymentOrder: async (input) => ({ success: true, rechargeId: input.rechargeId, providerPaymentId: `ppe_${Date.now()}`, amountINR: input.amountINR, currency: 'INR' }),
  verifyPaymentSignature: async (input) => ({ verified: false, status: 'FAILED', rechargeId: input.rechargeId, providerPaymentId: input.providerPaymentId, amountINR: input.actualPaidAmountINR || 0, reasonMessage: 'PhonePe API credentials not configured.' }),
  handleWebhook: async (payload) => ({ verified: false, status: 'FAILED', rechargeId: (payload.rechargeId as string) || 'RCH-1', providerPaymentId: 'PPE-WH', amountINR: 0, reasonMessage: 'PhonePe webhook signature verification unconfigured.' }),
  processRefund: async () => ({ success: true, refundRef: `RFD-PPE-${Date.now()}` }),
};

// Provider Resolver Factory
export const getPaymentProviderAdapter = (providerId: string): PaymentProviderAdapter => {
  const id = providerId.toLowerCase();
  if (id === 'razorpay') return RazorpayAdapter;
  if (id === 'cashfree') return CashfreeAdapter;
  if (id === 'phonepe') return PhonePeAdapter;
  return MockPaymentGatewayAdapter;
};
