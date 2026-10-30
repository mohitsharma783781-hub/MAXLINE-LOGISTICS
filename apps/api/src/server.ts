import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import paymentRoutes from './routes/payment.routes';
import adminB2BRatesRoutes from './routes/adminB2BRates.routes';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Security headers
app.use(helmet());

// CORS Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Standard middleware
app.use(express.json());

// Root informational endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    service: 'MAXLINE LOGISTICS API',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        me: 'GET /api/v1/auth/me'
      },
      payments: {
        createOrder: 'POST /api/create-order or POST /api/v1/payments/create-order',
        verifyPayment: 'POST /api/verify-payment or POST /api/v1/payments/verify-payment'
      },
      admin: {
        verify: 'GET /api/v1/admin/verify'
      }
    }
  });
});

// Health check endpoint
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'maxline-logistics-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount authentication and admin routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/b2b-rates', adminB2BRatesRoutes);
app.use('/api/v1/pricing/b2b', adminB2BRatesRoutes);

// Mount payment routes (both direct standard paths and versioned paths)
app.use('/api', paymentRoutes);
app.use('/api/v1/payments', paymentRoutes);

// 404 handler for unknown routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`
    }
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]:', err.message);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error'
    }
  });
});

// Start server only when executed directly and not imported as a module in tests
let server: any;
if (require.main === module && process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`[MAXLINE API] Server running at http://localhost:${PORT}`);
    console.log(`[MAXLINE API] Health check available at http://localhost:${PORT}/api/v1/health`);
    console.log(`[MAXLINE API] Auth endpoints mounted at http://localhost:${PORT}/api/v1/auth`);
  });

  const shutdown = (signal: string) => {
    console.log(`[MAXLINE API] Received ${signal}. Shutting down gracefully...`);
    server?.close(() => {
      console.log('[MAXLINE API] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export default app;
