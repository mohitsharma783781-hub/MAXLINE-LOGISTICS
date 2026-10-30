import { WalletService } from '../mocks/wallet.mock';
import type { WalletTransaction } from '../types/wallet';

export interface PaymentRechargeInput {
  tenantId: string;
  amountINR: number;
  paymentMethod?: string;
}

export interface PaymentRechargeResult {
  success: boolean;
  message: string;
  transactionId?: string;
  referenceId?: string;
  amountINR?: number;
  providerName: string;
  isMock: boolean;
  transaction?: WalletTransaction | null;
}

export const MockPaymentGateway = {
  processMockRecharge: (input: PaymentRechargeInput): PaymentRechargeResult => {
    if (!input.amountINR || input.amountINR <= 0) {
      return {
        success: false,
        message: 'Recharge amount must be greater than zero.',
        providerName: 'Mock Payment Gateway (Development Mode)',
        isMock: true,
      };
    }

    // Call WalletService atomic recharge
    const tx = WalletService.recharge(input.amountINR, 'Mock Payment Gateway (Development Mode)');

    return {
      success: true,
      message: `✓ Mock Recharge Successful! ₹${input.amountINR.toFixed(2)} credited to wallet balance.`,
      transactionId: tx.id,
      referenceId: tx.referenceId,
      amountINR: input.amountINR,
      providerName: 'Mock Payment Gateway (Development Mode)',
      isMock: true,
      transaction: tx,
    };
  },
};

export const PaymentGatewayAdapter = {
  // Clean payment gateway abstraction ready for Razorpay/Paytm/Stripe adapters
  rechargeWallet: async (input: PaymentRechargeInput): Promise<PaymentRechargeResult> => {
    // Currently using MockPaymentGateway for development
    return MockPaymentGateway.processMockRecharge(input);
  },
};
