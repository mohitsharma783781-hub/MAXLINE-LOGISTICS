process.env.NODE_ENV = 'test';

import assert from 'node:assert';
import http from 'node:http';
import { validateRegistrationInput, validateLoginInput } from '../utils/validation';
import { hashPassword, comparePassword } from '../utils/password';
import { signAuthToken, verifyAuthToken } from '../utils/jwt';
import { authenticateToken, requireMerchantMember, requirePlatformAdmin } from '../middleware/auth.middleware';
import { registerHandler, loginHandler, meHandler } from '../controllers/auth.controller';
import { prisma } from '../db';
import app from '../server';

let passedTests = 0;
let totalTests = 0;

async function runTest(testName: string, fn: () => Promise<void> | void) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

// Mock helper for Express req/res
function createMockReqRes(options: {
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  query?: Record<string, string>;
  user?: any;
}) {
  const req: any = {
    body: options.body || {},
    headers: options.headers || {},
    params: options.params || {},
    query: options.query || {},
    user: options.user
  };

  let statusCode = 200;
  let responseData: any = null;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
    getStatusCode() {
      return statusCode;
    },
    getResponseData() {
      return responseData;
    }
  };

  return { req, res };
}

async function runAllTests() {
  console.log('\n=== RUNNING AUTH FOUNDATION TEST SUITE ===\n');

  // 1. Validation Tests
  console.log('[1/5] Testing Input Validation & Sanitization:');

  await runTest('Registration validation succeeds for valid payload', () => {
    const result = validateRegistrationInput({
      name: 'Test Merchant',
      businessName: 'Express Logistics Pvt Ltd',
      email: 'merchant@maxlinelogistics.com',
      password: 'SecurePassword123!'
    });
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
    assert.strictEqual(result.data?.email, 'merchant@maxlinelogistics.com');
  });

  await runTest('Registration validation rejects invalid / missing fields', () => {
    const result = validateRegistrationInput({
      name: 'A', // too short
      businessName: '',
      email: 'not-an-email',
      password: 'short' // < 8 chars
    });
    assert.strictEqual(result.isValid, false);
    assert(result.errors.length >= 3);
  });

  await runTest('Registration validation enforces password maximum length (72 chars)', () => {
    const result = validateRegistrationInput({
      name: 'Valid Name',
      businessName: 'Valid Business',
      email: 'valid@example.com',
      password: 'a'.repeat(73)
    });
    assert.strictEqual(result.isValid, false);
    assert(result.errors.some(e => e.includes('72 characters')));
  });

  await runTest('Login validation succeeds for valid email and password', () => {
    const result = validateLoginInput({
      email: 'user@example.com',
      password: 'Password123'
    });
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.data?.email, 'user@example.com');
  });

  await runTest('Login validation rejects missing email or password', () => {
    const result = validateLoginInput({ email: '', password: '' });
    assert.strictEqual(result.isValid, false);
    assert(result.errors.length >= 2);
  });

  // 2. Password Hashing & Verification Tests
  console.log('\n[2/5] Testing Password Hashing & Bcrypt Verification:');

  let sampleHash = '';
  await runTest('hashPassword produces a valid bcrypt hash with correct work factor', async () => {
    sampleHash = await hashPassword('SuperSecret123$');
    assert.strictEqual(typeof sampleHash, 'string');
    // Bcrypt hashes start with $2a$ or $2b$ and are 60 characters long
    assert(/^(\$2[abxy]?\$12\$[./A-Za-z0-9]{53})$/.test(sampleHash), 'Must be standard bcrypt hash with 12 rounds');
  });

  await runTest('comparePassword succeeds for matching plaintext and hash', async () => {
    const matches = await comparePassword('SuperSecret123$', sampleHash);
    assert.strictEqual(matches, true);
  });

  await runTest('comparePassword fails for incorrect password', async () => {
    const matches = await comparePassword('WrongPassword!', sampleHash);
    assert.strictEqual(matches, false);
  });

  // 3. JWT Signing & Verification Tests
  console.log('\n[3/5] Testing JWT Signing & Verification:');

  let sampleToken = '';
  await runTest('signAuthToken generates a cryptographically signed JWT', () => {
    sampleToken = signAuthToken({
      userId: 'usr-12345678',
      email: 'admin@maxlinelogistics.com',
      merchantId: 'mch-87654321',
      role: 'OWNER'
    });
    assert.strictEqual(typeof sampleToken, 'string');
    assert.strictEqual(sampleToken.split('.').length, 3, 'JWT must have 3 segments (header.payload.signature)');
  });

  await runTest('verifyAuthToken decodes authentic JWT claims correctly', () => {
    const decoded = verifyAuthToken(sampleToken);
    assert.strictEqual(decoded.userId, 'usr-12345678');
    assert.strictEqual(decoded.email, 'admin@maxlinelogistics.com');
    assert.strictEqual(decoded.merchantId, 'mch-87654321');
    assert.strictEqual(decoded.role, 'OWNER');
  });

  await runTest('verifyAuthToken rejects tampered tokens', () => {
    const tampered = sampleToken.slice(0, -5) + 'abcde';
    assert.throws(() => {
      verifyAuthToken(tampered);
    });
  });

  // 4. Middlewares & Controllers Unit Tests
  console.log('\n[4/5] Testing Middlewares & Auth Handlers:');

  await runTest('authenticateToken rejects missing Authorization header with 401', () => {
    const { req, res } = createMockReqRes({ headers: {} });
    let nextCalled = false;
    authenticateToken(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.getStatusCode(), 401);
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.getResponseData().success, false);
  });

  await runTest('authenticateToken rejects malformed Bearer header with 401', () => {
    const { req, res } = createMockReqRes({ headers: { authorization: 'Basic 123456' } });
    let nextCalled = false;
    authenticateToken(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.getStatusCode(), 401);
    assert.strictEqual(nextCalled, false);
  });

  await runTest('authenticateToken accepts valid Bearer token and attaches req.user', () => {
    const { req, res } = createMockReqRes({ headers: { authorization: `Bearer ${sampleToken}` } });
    let nextCalled = false;
    authenticateToken(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user?.userId, 'usr-12345678');
    assert.strictEqual(req.user?.role, 'OWNER');
  });

  await runTest('requireMerchantMember rejects unauthenticated requests with 401', async () => {
    const { req, res } = createMockReqRes({});
    let nextCalled = false;
    await requireMerchantMember(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.getStatusCode(), 401);
    assert.strictEqual(nextCalled, false);
  });

  await runTest('requirePlatformAdmin rejects unauthenticated requests with 401', () => {
    const { req, res } = createMockReqRes({});
    let nextCalled = false;
    requirePlatformAdmin(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.getStatusCode(), 401);
    assert.strictEqual(nextCalled, false);
  });

  await runTest('requirePlatformAdmin rejects merchant OWNER role with 403 Forbidden', () => {
    const { req, res } = createMockReqRes({
      user: { userId: 'usr-1', email: 'merchant@store.com', role: 'OWNER' }
    });
    let nextCalled = false;
    requirePlatformAdmin(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.getStatusCode(), 403);
    assert.strictEqual(nextCalled, false);
    assert(res.getResponseData().error.message.includes('Platform administrator privileges required'));
  });

  await runTest('requirePlatformAdmin accepts verified platform SUPER_ADMIN role', () => {
    const { req, res } = createMockReqRes({
      user: { userId: 'admin-1', email: 'admin@maxlinelogistics.com', role: 'SUPER_ADMIN', isPlatformAdmin: true }
    });
    let nextCalled = false;
    requirePlatformAdmin(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
  });

  await runTest('requirePlatformAdmin accepts verified platform ADMIN_OPERATOR role', () => {
    const { req, res } = createMockReqRes({
      user: { userId: 'ops-1', email: 'ops@maxlinelogistics.com', role: 'ADMIN_OPERATOR', isPlatformAdmin: true }
    });
    let nextCalled = false;
    requirePlatformAdmin(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
  });

  await runTest('registerHandler rejects duplicate email with 409 Conflict', async () => {
    // Mock prisma.public_users.findUnique to simulate an existing email
    const originalFindUnique = prisma.public_users.findUnique;
    prisma.public_users.findUnique = (async (args: any) => {
      return { id: 'existing-id', email: args.where.email } as any;
    }) as any;

    try {
      const { req, res } = createMockReqRes({
        body: {
          name: 'John Doe',
          businessName: 'Express Logistics',
          email: 'duplicate@example.com',
          password: 'Password123'
        }
      });
      await registerHandler(req, res);
      assert.strictEqual(res.getStatusCode(), 409);
      assert.strictEqual(res.getResponseData().success, false);
      assert(res.getResponseData().error.message.includes('already exists'));
    } finally {
      prisma.public_users.findUnique = originalFindUnique;
    }
  });

  await runTest('registerHandler creates User, Merchant, and Member (OWNER) inside transaction', async () => {
    const originalFindUnique = prisma.public_users.findUnique;
    const originalTransaction = prisma.$transaction;

    prisma.public_users.findUnique = (async () => null) as any;
    let transactionExecuted = false;

    prisma.$transaction = (async (fn: any) => {
      transactionExecuted = true;
      const mockTx = {
        auth_users: {
          create: async (args: any) => ({
            id: 'mock-auth-id',
            email: args.data.email,
            encrypted_password: args.data.encrypted_password
          })
        },
        public_users: {
          create: async (args: any) => ({
            id: 'mock-user-id',
            full_name: args.data.full_name,
            email: args.data.email,
            created_at: new Date()
          })
        },
        merchants: {
          create: async (args: any) => ({
            id: 'mock-merchant-id',
            business_name: args.data.business_name
          })
        },
        merchant_members: {
          create: async (args: any) => ({
            id: 'mock-member-id',
            user_id: args.data.user_id,
            merchant_id: args.data.merchant_id,
            role: args.data.role
          })
        }
      };
      return fn(mockTx);
    }) as any;

    try {
      const { req, res } = createMockReqRes({
        body: {
          name: 'Jane Smith',
          businessName: 'Smith Freight Solutions',
          email: 'jane@smithfreight.com',
          password: 'SecurePassword123'
        }
      });
      await registerHandler(req, res);
      assert.strictEqual(res.getStatusCode(), 201);
      assert.strictEqual(transactionExecuted, true);

      const resp = res.getResponseData();
      assert.strictEqual(resp.success, true);
      assert.strictEqual(resp.data.user.email, 'jane@smithfreight.com');
      assert.strictEqual(resp.data.merchant.businessName, 'Smith Freight Solutions');
      assert.strictEqual(resp.data.merchant.role, 'OWNER');
      assert(resp.data.token, 'Must return signed token');
      // Ensure passwordHash is never leaked
      assert.strictEqual(resp.data.user.passwordHash, undefined);
    } finally {
      prisma.public_users.findUnique = originalFindUnique;
      prisma.$transaction = originalTransaction;
    }
  });

  await runTest('loginHandler rejects non-existent email with generic 401 error', async () => {
    const originalFindUnique = prisma.public_users.findUnique;
    prisma.public_users.findUnique = (async () => null) as any;

    try {
      const { req, res } = createMockReqRes({
        body: { email: 'nonexistent@example.com', password: 'Password123' }
      });
      await loginHandler(req, res);
      assert.strictEqual(res.getStatusCode(), 401);
      assert.strictEqual(res.getResponseData().error.message, 'Invalid email or password.');
    } finally {
      prisma.public_users.findUnique = originalFindUnique;
    }
  });

  await runTest('loginHandler rejects incorrect password with generic 401 error', async () => {
    const realHash = await hashPassword('CorrectPassword123');
    const originalFindUnique = prisma.public_users.findUnique;
    prisma.public_users.findUnique = (async () => ({
      id: 'usr-1',
      email: 'user@example.com',
      users: { encrypted_password: realHash },
      merchant_members: []
    })) as any;

    try {
      const { req, res } = createMockReqRes({
        body: { email: 'user@example.com', password: 'WrongPassword!' }
      });
      await loginHandler(req, res);
      assert.strictEqual(res.getStatusCode(), 401);
      assert.strictEqual(res.getResponseData().error.message, 'Invalid email or password.');
    } finally {
      prisma.public_users.findUnique = originalFindUnique;
    }
  });

  await runTest('loginHandler succeeds with valid credentials and returns token', async () => {
    const realHash = await hashPassword('CorrectPassword123');
    const originalFindUnique = prisma.public_users.findUnique;
    prisma.public_users.findUnique = (async () => ({
      id: 'usr-1',
      full_name: 'Test Merchant User',
      email: 'user@example.com',
      created_at: new Date(),
      users: { encrypted_password: realHash },
      merchant_members: [
        {
          id: 'mem-1',
          role: 'OWNER',
          merchant_id: 'merch-1',
          merchants: { id: 'merch-1', business_name: 'Prime Cargo Ltd' }
        }
      ]
    })) as any;

    try {
      const { req, res } = createMockReqRes({
        body: { email: 'user@example.com', password: 'CorrectPassword123' }
      });
      await loginHandler(req, res);
      assert.strictEqual(res.getStatusCode(), 200);
      const resp = res.getResponseData();
      assert.strictEqual(resp.success, true);
      assert.strictEqual(resp.data.user.email, 'user@example.com');
      assert.strictEqual(resp.data.merchant.businessName, 'Prime Cargo Ltd');
      assert.strictEqual(resp.data.merchant.role, 'OWNER');
      assert(resp.data.token);
      assert.strictEqual(resp.data.user.passwordHash, undefined);
    } finally {
      prisma.public_users.findUnique = originalFindUnique;
    }
  });

  await runTest('meHandler returns sanitized user profile and merchant memberships', async () => {
    const originalFindUnique = prisma.public_users.findUnique;
    prisma.public_users.findUnique = (async () => ({
      id: 'usr-123',
      full_name: 'Owner User',
      email: 'owner@maxline.com',
      created_at: new Date(),
      updated_at: new Date(),
      merchant_members: [
        {
          id: 'mem-1',
          role: 'OWNER',
          created_at: new Date(),
          merchants: {
            id: 'mch-1',
            business_name: 'Maxline Main Merchant',
            created_at: new Date()
          }
        }
      ]
    })) as any;

    try {
      const { req, res } = createMockReqRes({
        user: { userId: 'usr-123', email: 'owner@maxline.com' }
      });
      await meHandler(req, res);
      assert.strictEqual(res.getStatusCode(), 200);
      const resp = res.getResponseData();
      assert.strictEqual(resp.success, true);
      assert.strictEqual(resp.data.user.id, 'usr-123');
      assert.strictEqual(resp.data.user.memberships.length, 1);
      assert.strictEqual(resp.data.user.passwordHash, undefined);
    } finally {
      prisma.public_users.findUnique = originalFindUnique;
    }
  });

  // 5. Full HTTP Server & Helmet Security Verification
  console.log('\n[5/5] Testing HTTP Endpoints & Security Headers:');

  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => {
    testServer.listen(0, () => resolve());
  });

  const address = testServer.address() as any;
  const baseUrl = `http://localhost:${address.port}`;

  try {
    await runTest('GET / returns API catalog with auth endpoints', async () => {
      const res = await fetch(`${baseUrl}/`);
      const body: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.service, 'MAXLINE LOGISTICS API');
      assert(body.endpoints.auth.register);
      assert(body.endpoints.auth.login);
      assert(body.endpoints.auth.me);
    });

    await runTest('Helmet sets security headers (X-Content-Type-Options, Strict-Transport-Security, etc.)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`);
      assert.strictEqual(res.status, 200);
      assert(res.headers.has('x-content-type-options'));
      assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    });

    await runTest('POST /api/v1/auth/register with empty payload returns 400 Validation Error', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const body: any = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.success, false);
      assert(body.error.details.length > 0);
    });

    await runTest('POST /api/v1/auth/login with empty payload returns 400 Validation Error', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const body: any = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.success, false);
    });

    await runTest('GET /api/v1/auth/me without token returns 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`);
      const body: any = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.success, false);
      assert(body.error.message.includes('missing or malformed'));
    });

    await runTest('GET /api/v1/auth/me with invalid token returns 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: 'Bearer invalid.token.value' }
      });
      const body: any = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.success, false);
      assert(body.error.message.includes('invalid or expired'));
    });

    await runTest('GET /api/v1/admin/verify without token returns 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/verify`);
      const body: any = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.success, false);
    });

    await runTest('GET /api/v1/admin/verify with merchant token returns 403 Forbidden', async () => {
      const merchantToken = signAuthToken({
        userId: 'usr-merchant',
        email: 'merchant@store.com',
        role: 'OWNER'
      });
      const res = await fetch(`${baseUrl}/api/v1/admin/verify`, {
        headers: { Authorization: `Bearer ${merchantToken}` }
      });
      const body: any = await res.json();
      assert.strictEqual(res.status, 403);
      assert.strictEqual(body.success, false);
      assert(body.error.message.includes('Platform administrator privileges required'));
    });

    await runTest('GET /api/v1/admin/verify with platform admin token returns 200 OK', async () => {
      const adminToken = signAuthToken({
        userId: 'usr-platform-admin',
        email: 'admin@maxlinelogistics.com',
        role: 'SUPER_ADMIN',
        isPlatformAdmin: true
      });
      const res = await fetch(`${baseUrl}/api/v1/admin/verify`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const body: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.isVerifiedAdmin, true);
      assert.strictEqual(body.data.user.role, 'SUPER_ADMIN');
    });
  } finally {
    await new Promise<void>((resolve) => {
      if (typeof (testServer as any).closeAllConnections === 'function') {
        (testServer as any).closeAllConnections();
      }
      testServer.close(() => resolve());
    });
  }

  console.log(`\n=========================================`);
  console.log(`RESULTS: ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY`);
  console.log(`=========================================\n`);

  await prisma.$disconnect();
}

runAllTests().catch(async (err) => {
  console.error('\nTest runner failed:', err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
