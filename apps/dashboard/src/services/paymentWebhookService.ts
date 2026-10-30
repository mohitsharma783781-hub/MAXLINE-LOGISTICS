import { WalletRechargeService, type WalletRechargeRecord } from './walletRechargeService';

export interface PaymentWebhookPayload extends Record<string, unknown> {
  providerId: string;
  rechargeId: string;
  providerPaymentId: string;
  signature: string;
  paidAmountINR: number;
}

export const PaymentWebhookService = {
  processIncomingPaymentWebhook: async (
    payload: PaymentWebhookPayload
  ): Promise<{ success: boolean; message: string; recharge?: WalletRechargeRecord }> => {
    const { rechargeId, providerPaymentId, signature, paidAmountINR } = payload;

    const res = await WalletRechargeService.verifyAndCreditWallet({
      rechargeId,
      providerPaymentId,
      rawSignature: signature,
      actualPaidAmountINR: paidAmountINR,
    });

    return {
      success: res.success,
      message: res.message,
      recharge: res.recharge,
    };
  },
};
