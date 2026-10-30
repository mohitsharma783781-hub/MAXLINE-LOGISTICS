import { Request } from 'express';
import { AuthTokenPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
      merchantMember?: {
        id: string;
        userId: string;
        merchantId: string;
        role: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: AuthTokenPayload;
}
