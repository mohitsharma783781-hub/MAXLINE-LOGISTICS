import { prisma } from './db';

async function testConnection() {
  console.log('[MAXLINE DB Check] Initiating non-destructive connection test to PostgreSQL...');
  try {
    const start = Date.now();
    // Non-destructive ping query: verifies connection credentials and network reachability without touching any tables
    const result = await prisma.$queryRaw<Array<{ connected: number }>>`SELECT 1 as connected`;
    const latency = Date.now() - start;

    if (result && result.length > 0) {
      console.log(`[MAXLINE DB Check] SUCCESS: Database responded in ${latency}ms.`);
      console.log('[MAXLINE DB Check] Ready for Prisma schema migrations.');
      process.exit(0);
    } else {
      console.error('[MAXLINE DB Check] ERROR: Unexpected response from database test query.');
      process.exit(1);
    }
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    console.error('[MAXLINE DB Check] FAILED: Could not establish database connection.');
    if (error.code) {
      console.error(`[MAXLINE DB Check] Prisma Error Code: ${error.code}`);
    }
    console.error(`[MAXLINE DB Check] Message: ${error.message || String(err)}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
