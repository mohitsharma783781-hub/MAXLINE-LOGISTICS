import { Request, Response } from 'express';
import crypto from 'crypto';
import { razorpayInstance, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from '../config/razorpay.config';
import { prisma } from '../db';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    // Validate amount
    const parsedAmount = Number(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 100) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid amount. Minimum amount is 100 paise (₹1.00).',
        },
      });
      return;
    }

    const orderReceipt = receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const options = {
      amount: Math.round(parsedAmount), // Amount in paise
      currency: (currency || 'INR').toUpperCase(),
      receipt: String(orderReceipt).slice(0, 40),
      notes: notes || {},
    };

    const order = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: RAZORPAY_KEY_ID,
      receipt: order.receipt,
    });
  } catch (error: any) {
    console.error('[Razorpay Order Creation Error]:', error);
    
    // Check if error is authentication error from Razorpay
    if (error?.statusCode === 401) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Razorpay authentication failed. Invalid API credentials.',
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        message: error?.error?.description || error?.message || 'Failed to create Razorpay order',
      },
    });
  }
};

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Missing required parameters: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
        },
      });
      return;
    }

    // Generate expected signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    // Secure timing-safe signature comparison
    const isSignatureValid =
      generatedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature, 'utf-8'),
        Buffer.from(razorpay_signature, 'utf-8')
      );

    if (!isSignatureValid) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Payment verification failed: Signature mismatch.',
        },
      });
      return;
    }

    // Signature verified successfully — Atomically credit merchant wallet in PostgreSQL
    let creditedBalanceINR: number | null = null;
    try {
      const rzpOrder = await razorpayInstance.orders.fetch(razorpay_order_id);
      const amountMinor = BigInt(rzpOrder.amount);
      const merchantId = req.body.merchantId || rzpOrder.notes?.merchantId || rzpOrder.notes?.tenantId;

      if (merchantId) {
        const idempotencyKey = `rzp_${razorpay_payment_id}`;
        const existingTx = await prisma.wallet_transactions.findUnique({
          where: { idempotency_key: idempotencyKey },
        });

        if (!existingTx) {
          const updatedWallet = await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallets.findFirst({
              where: { merchant_id: merchantId },
            });

            if (wallet) {
              const balanceBefore = wallet.available_balance_minor;
              const balanceAfter = balanceBefore + amountMinor;

              const updated = await tx.wallets.update({
                where: { id: wallet.id },
                data: {
                  available_balance_minor: balanceAfter,
                  total_recharged_minor: wallet.total_recharged_minor + amountMinor,
                  version: { increment: 1 },
                  updated_at: new Date(),
                },
              });

              await tx.wallet_transactions.create({
                data: {
                  merchant_id: merchantId,
                  wallet_id: wallet.id,
                  type: 'RECHARGE',
                  direction: 'CREDIT',
                  amount_minor: amountMinor,
                  balance_before_minor: balanceBefore,
                  balance_after_minor: balanceAfter,
                  currency: 'INR',
                  idempotency_key: idempotencyKey,
                  reference_type: 'RAZORPAY',
                  reference_id: razorpay_payment_id,
                  description: `Wallet recharge via Razorpay (Payment ID: ${razorpay_payment_id})`,
                  is_system_generated: true,
                },
              });

              return updated;
            }
            return null;
          });

          if (updatedWallet) {
            creditedBalanceINR = Number(updatedWallet.available_balance_minor) / 100;
          }
        }
      }
    } catch (dbErr: any) {
      console.warn('[Payment Wallet Sync Warning]:', dbErr?.message || dbErr);
    }

    res.status(200).json({
      success: true,
      message: 'Payment signature verified successfully.',
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      creditedBalanceINR,
      verified_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Razorpay Verification Error]:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error?.message || 'Failed to verify payment signature',
      },
    });
  }
};
