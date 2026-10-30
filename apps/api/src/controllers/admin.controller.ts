import { Request, Response } from 'express';
import { prisma } from '../db';

/**
 * GET /api/v1/admin/dashboard-stats
 * Real database metrics for Platform Admin Dashboard
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalMerchants,
      activeMerchants,
      pendingMerchants,
      totalShipments,
      deliveredShipments,
      inTransitShipments,
      wallets,
    ] = await Promise.all([
      prisma.merchants.count(),
      prisma.merchants.count({ where: { status: 'ACTIVE' } }),
      prisma.merchants.count({ where: { status: 'PENDING_KYC' } }),
      prisma.shipments.count(),
      prisma.shipments.count({ where: { status: 'DELIVERED' } }),
      prisma.shipments.count({ where: { status: 'IN_TRANSIT' } }),
      prisma.wallets.findMany({
        select: {
          available_balance_minor: true,
          total_recharged_minor: true,
          total_spent_minor: true,
        },
      }),
    ]);

    let totalAvailableMinor = BigInt(0);
    let totalRechargedMinor = BigInt(0);
    let totalSpentMinor = BigInt(0);

    for (const w of wallets) {
      totalAvailableMinor += w.available_balance_minor || BigInt(0);
      totalRechargedMinor += w.total_recharged_minor || BigInt(0);
      totalSpentMinor += w.total_spent_minor || BigInt(0);
    }

    res.status(200).json({
      success: true,
      data: {
        merchants: {
          total: totalMerchants,
          active: activeMerchants,
          pending: pendingMerchants,
          suspended: totalMerchants - activeMerchants - pendingMerchants,
        },
        shipments: {
          total: totalShipments,
          delivered: deliveredShipments,
          inTransit: inTransitShipments,
          pending: totalShipments - deliveredShipments - inTransitShipments,
        },
        financials: {
          totalAvailableBalanceINR: Number(totalAvailableMinor) / 100,
          totalRechargedINR: Number(totalRechargedMinor) / 100,
          totalSpentINR: Number(totalSpentMinor) / 100,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('[Admin Dashboard Stats Error]:', err);
    res.status(500).json({
      success: false,
      error: { message: err?.message || 'Failed to fetch dashboard statistics' },
    });
  }
};

/**
 * GET /api/v1/admin/merchants
 * Real list of registered merchants with wallet and member details
 */
export const getMerchants = async (_req: Request, res: Response): Promise<void> => {
  try {
    const merchants = await prisma.merchants.findMany({
      include: {
        wallets: true,
        merchant_members: {
          include: {
            users: true,
          },
        },
        warehouses: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = merchants.map((m) => {
      const primaryMember = m.merchant_members?.[0]?.users;
      const wallet = m.wallets;
      return {
        id: m.id,
        businessName: m.business_name,
        status: m.status,
        createdAt: m.created_at,
        ownerName: primaryMember?.full_name || 'Merchant Owner',
        ownerEmail: primaryMember?.email || 'N/A',
        ownerPhone: primaryMember?.phone || 'N/A',
        warehouseCount: m.warehouses?.length || 0,
        walletBalanceINR: wallet ? Number(wallet.available_balance_minor) / 100 : 0,
        walletStatus: wallet?.status || 'ACTIVE',
      };
    });

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (err: any) {
    console.error('[Admin Get Merchants Error]:', err);
    res.status(500).json({
      success: false,
      error: { message: err?.message || 'Failed to fetch merchants' },
    });
  }
};

/**
 * PUT /api/v1/admin/merchants/:id/status
 * Activate or suspend merchant account
 */
export const updateMerchantStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'PENDING_KYC', 'CLOSED'].includes(status)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid status. Must be ACTIVE, SUSPENDED, PENDING_KYC, or CLOSED.' },
      });
      return;
    }

    const updated = await prisma.merchants.update({
      where: { id },
      data: {
        status: status as any,
        updated_at: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: `Merchant status updated to ${status}.`,
      data: updated,
    });
  } catch (err: any) {
    console.error('[Admin Update Merchant Status Error]:', err);
    res.status(500).json({
      success: false,
      error: { message: err?.message || 'Failed to update merchant status' },
    });
  }
};

/**
 * GET /api/v1/admin/wallets
 * List all merchant wallets and balances
 */
export const getWallets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const wallets = await prisma.wallets.findMany({
      include: {
        merchants: {
          include: {
            merchant_members: {
              include: {
                users: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = wallets.map((w) => {
      const primaryUser = w.merchants?.merchant_members?.[0]?.users;
      return {
        id: w.id,
        merchantId: w.merchant_id,
        merchantName: w.merchants?.business_name || 'Merchant',
        email: primaryUser?.email || 'N/A',
        balanceINR: Number(w.available_balance_minor) / 100,
        totalRechargedINR: Number(w.total_recharged_minor) / 100,
        totalSpentINR: Number(w.total_spent_minor) / 100,
        status: w.status,
        updatedAt: w.updated_at,
      };
    });

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (err: any) {
    console.error('[Admin Get Wallets Error]:', err);
    res.status(500).json({
      success: false,
      error: { message: err?.message || 'Failed to fetch wallets' },
    });
  }
};

/**
 * POST /api/v1/admin/wallets/adjust
 * Atomic manual credit/debit adjustment with audit log protection
 */
export const adjustWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { merchantId, amountINR, direction, reason } = req.body;

    if (!merchantId || !amountINR || !direction || !reason?.trim()) {
      res.status(400).json({
        success: false,
        error: { message: 'Missing required fields: merchantId, amountINR, direction (CREDIT/DEBIT), and reason.' },
      });
      return;
    }

    const amountMinor = BigInt(Math.round(Number(amountINR) * 100));
    if (amountMinor <= BigInt(0)) {
      res.status(400).json({
        success: false,
        error: { message: 'Adjustment amount must be greater than zero.' },
      });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallets.findFirst({
        where: { merchant_id: merchantId },
      });

      if (!wallet) {
        throw new Error('Wallet not found for this merchant.');
      }

      const balanceBefore = wallet.available_balance_minor;
      let balanceAfter = balanceBefore;

      if (direction === 'DEBIT') {
        if (balanceBefore < amountMinor) {
          throw new Error(`Insufficient wallet balance. Available: ₹${Number(balanceBefore) / 100}, Requested Debit: ₹${amountINR}`);
        }
        balanceAfter = balanceBefore - amountMinor;
      } else {
        balanceAfter = balanceBefore + amountMinor;
      }

      const updatedWallet = await tx.wallets.update({
        where: { id: wallet.id },
        data: {
          available_balance_minor: balanceAfter,
          total_recharged_minor: direction === 'CREDIT' ? wallet.total_recharged_minor + amountMinor : wallet.total_recharged_minor,
          version: { increment: 1 },
          updated_at: new Date(),
        },
      });

      const txRecord = await tx.wallet_transactions.create({
        data: {
          merchant_id: merchantId,
          wallet_id: wallet.id,
          type: direction === 'CREDIT' ? 'MANUAL_CREDIT' : 'MANUAL_DEBIT',
          direction: direction as 'CREDIT' | 'DEBIT',
          amount_minor: amountMinor,
          balance_before_minor: balanceBefore,
          balance_after_minor: balanceAfter,
          currency: 'INR',
          idempotency_key: `adj_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          reference_type: 'ADMIN_ADJUSTMENT',
          reference_id: `ADJ-${Date.now().toString().slice(-6)}`,
          description: `Admin Adjustment (${direction}): ${reason.trim()}`,
          is_system_generated: false,
        },
      });

      return { updatedWallet, txRecord };
    });

    res.status(200).json({
      success: true,
      message: `Successfully ${direction === 'CREDIT' ? 'credited' : 'debited'} ₹${Number(amountINR).toFixed(2)}.`,
      data: {
        newBalanceINR: Number(result.updatedWallet.available_balance_minor) / 100,
        transactionId: result.txRecord.id,
      },
    });
  } catch (err: any) {
    console.error('[Admin Wallet Adjustment Error]:', err);
    res.status(500).json({
      success: false,
      error: { message: err?.message || 'Failed to process wallet adjustment' },
    });
  }
};
