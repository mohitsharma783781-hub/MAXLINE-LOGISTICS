import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../utils/jwt';
import { prisma } from '../db';
import '../types/auth.types';

/**
 * Middleware that validates the JWT bearer token on protected routes.
 * Attaches decoded user payload (userId, email, merchantId, role) to req.user.
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Unauthorized. Authentication token is missing or malformed.'
      }
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Unauthorized. Bearer token is empty.'
      }
    });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Unauthorized. Authentication token is invalid or expired.'
      }
    });
    return;
  }
};

/**
 * Middleware that verifies the authenticated user has an active membership
 * in the requested merchant context. Prevents unauthorized cross-tenant data access.
 */
export const requireMerchantMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Unauthorized. Authentication required.'
      }
    });
    return;
  }

  const targetMerchantId =
    (req.params.merchantId as string) ||
    (req.body && (req.body.merchantId as string)) ||
    (req.query && (req.query.merchantId as string)) ||
    req.user.merchantId;

  if (!targetMerchantId) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Merchant context (merchantId) is required for this operation.'
      }
    });
    return;
  }

  try {
    const member = await prisma.merchant_members.findUnique({
      where: {
        merchant_id_user_id: {
          merchant_id: targetMerchantId,
          user_id: req.user.userId
        }
      }
    });

    if (!member) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Forbidden. You do not have access to this merchant resource.'
        }
      });
      return;
    }

    req.merchantMember = {
      id: member.id,
      userId: member.user_id,
      merchantId: member.merchant_id,
      role: member.role
    };
    next();
  } catch (error: any) {
    console.error('[Merchant Authorization Error]:', error.message);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error verifying merchant authorization.'
      }
    });
  }
};

/**
 * Middleware that validates the caller has verified platform-admin privileges.
 * Explicitly rejects merchant-level roles (OWNER, ADMIN, MEMBER, etc.).
 */
export const requirePlatformAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Unauthorized. Platform administrator authentication required.'
      }
    });
    return;
  }

  const role = req.user.role;
  const isPlatformAdmin = Boolean(
    req.user.isPlatformAdmin === true ||
    role === 'SUPER_ADMIN' ||
    role === 'ADMIN_OPERATOR' ||
    role === 'super_admin'
  );

  // Reject merchant roles or non-admin users
  if (!isPlatformAdmin) {
    res.status(403).json({
      success: false,
      error: {
        message: 'Forbidden. Platform administrator privileges required to access this resource.'
      }
    });
    return;
  }

  next();
};
