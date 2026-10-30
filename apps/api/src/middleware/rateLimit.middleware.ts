import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for sensitive authentication endpoints (register, login).
 * Enforces a strict limit per IP to mitigate brute-force and credential stuffing attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  limit: 20, // Max 20 requests per IP per window
  standardHeaders: 'draft-8', // Return RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again later.'
    }
  }
});
