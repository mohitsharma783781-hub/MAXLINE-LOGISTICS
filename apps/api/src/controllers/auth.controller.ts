import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../db';
import { validateRegistrationInput, validateLoginInput } from '../utils/validation';
import { hashPassword, comparePassword } from '../utils/password';
import { signAuthToken } from '../utils/jwt';
import '../types/auth.types';

/**
 * Handles user registration with associated merchant and OWNER role in a single transaction.
 * POST /api/v1/auth/register
 */
export const registerHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = validateRegistrationInput(req.body);
    if (!validation.isValid || !validation.data) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: validation.errors
        }
      });
      return;
    }

    const { name, businessName, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.public_users.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          message: 'An account with this email address already exists.'
        }
      });
      return;
    }

    // Securely hash password
    const passwordHash = await hashPassword(password);

    // Create User, Merchant, and MerchantMember (OWNER) atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create auth_users record so Supabase GoTrue Auth is also synchronized
      const authUser = await tx.auth_users.create({
        data: {
          id: crypto.randomUUID(),
          email,
          encrypted_password: passwordHash,
          role: 'authenticated',
          email_confirmed_at: new Date(),
          raw_app_meta_data: { provider: 'email', providers: ['email'] },
          raw_user_meta_data: { full_name: name, business_name: businessName }
        }
      });

      // 2. Create public_users profile linked to authUser.id
      const newUser = await tx.public_users.create({
        data: {
          auth_user_id: authUser.id,
          full_name: name,
          email
        }
      });

      // 3. Create merchant
      const newMerchant = await tx.merchants.create({
        data: {
          business_name: businessName
        }
      });

      // 4. Create merchant member (OWNER)
      const newMember = await tx.merchant_members.create({
        data: {
          user_id: newUser.id,
          merchant_id: newMerchant.id,
          role: 'OWNER'
        }
      });

      return {
        user: newUser,
        merchant: newMerchant,
        member: newMember
      };
    });

    // Issue cryptographic JWT auth token
    const token = signAuthToken({
      userId: result.user.id,
      email: result.user.email,
      merchantId: result.merchant.id,
      role: 'OWNER'
    });

    // Response sanitized without passwordHash
    res.status(201).json({
      success: true,
      message: 'Merchant account registered successfully.',
      data: {
        user: {
          id: result.user.id,
          name: result.user.full_name,
          email: result.user.email,
          createdAt: result.user.created_at
        },
        merchant: {
          id: result.merchant.id,
          businessName: result.merchant.business_name,
          role: result.member.role
        },
        token
      }
    });
  } catch (error: any) {
    console.error('[Registration Error]:', error.message);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while creating your account. Please try again later.'
      }
    });
  }
};

/**
 * Handles user authentication, credential verification, and token issuance.
 * POST /api/v1/auth/login
 */
export const loginHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = validateLoginInput(req.body);
    if (!validation.isValid || !validation.data) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: validation.errors
        }
      });
      return;
    }

    const { email, password } = validation.data;

    const user = await prisma.public_users.findUnique({
      where: { email },
      include: {
        users: true, // auth_users relation containing encrypted_password
        merchant_members: {
          include: {
            merchants: true
          }
        }
      }
    });

    // Generic error message prevents user enumeration
    if (!user || !user.users?.encrypted_password || !(await comparePassword(password, user.users.encrypted_password))) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password.'
        }
      });
      return;
    }

    // Determine primary merchant context
    const primaryMembership = user.merchant_members && user.merchant_members.length > 0
      ? user.merchant_members[0]
      : undefined;

    const token = signAuthToken({
      userId: user.id,
      email: user.email,
      merchantId: primaryMembership?.merchant_id,
      role: primaryMembership?.role
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          createdAt: user.created_at
        },
        merchant: primaryMembership
          ? {
              id: primaryMembership.merchants.id,
              businessName: primaryMembership.merchants.business_name,
              role: primaryMembership.role
            }
          : null,
        token
      }
    });
  } catch (error: any) {
    console.error('[Login Error]:', error.message);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while signing in. Please try again later.'
      }
    });
  }
};

/**
 * Returns the authenticated user's profile and associated merchant memberships.
 * GET /api/v1/auth/me
 */
export const meHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Unauthorized. Authentication required.'
        }
      });
      return;
    }

    const user = await prisma.public_users.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        full_name: true,
        email: true,
        created_at: true,
        updated_at: true,
        merchant_members: {
          select: {
            id: true,
            role: true,
            created_at: true,
            merchants: {
              select: {
                id: true,
                business_name: true,
                created_at: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User account not found.'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          memberships: user.merchant_members.map(m => ({
            id: m.id,
            role: m.role,
            createdAt: m.created_at,
            merchant: {
              id: m.merchants.id,
              businessName: m.merchants.business_name,
              createdAt: m.merchants.created_at
            }
          }))
        }
      }
    });
  } catch (error: any) {
    console.error('[Me Profile Error]:', error.message);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred retrieving user profile.'
      }
    });
  }
};
