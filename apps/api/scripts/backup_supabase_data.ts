import fs from 'fs';
import path from 'path';
import { prisma } from '../src/db';

async function backup() {
  console.log('[Database Backup] Connecting to Supabase Postgres...');
  const snapshot: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tables: {},
  };

  try {
    const merchants = await prisma.merchants.findMany();
    snapshot.tables.merchants = merchants;
    console.log(`[Backup] merchants: ${merchants.length} records`);

    const users = await prisma.public_users.findMany();
    snapshot.tables.public_users = users;
    console.log(`[Backup] public_users: ${users.length} records`);

    const wallets = await prisma.wallets.findMany();
    snapshot.tables.wallets = wallets;
    console.log(`[Backup] wallets: ${wallets.length} records`);

    const walletTx = await prisma.wallet_transactions.findMany();
    snapshot.tables.wallet_transactions = walletTx;
    console.log(`[Backup] wallet_transactions: ${walletTx.length} records`);

    const warehouses = await prisma.warehouses.findMany();
    snapshot.tables.warehouses = warehouses;
    console.log(`[Backup] warehouses: ${warehouses.length} records`);

    const shipments = await prisma.shipments.findMany();
    snapshot.tables.shipments = shipments;
    console.log(`[Backup] shipments: ${shipments.length} records`);

    const rateCards = await prisma.carrier_rate_cards.findMany();
    snapshot.tables.carrier_rate_cards = rateCards;
    console.log(`[Backup] carrier_rate_cards: ${rateCards.length} records`);

    const b2bQuotes = await prisma.b2b_quotes.findMany();
    snapshot.tables.b2b_quotes = b2bQuotes;
    console.log(`[Backup] b2b_quotes: ${b2bQuotes.length} records`);

    const outDir = path.resolve(__dirname, '../../../database/pre_sprint_backups');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outFile = path.join(outDir, `supabase_snapshot_${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(snapshot, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2), 'utf-8');
    console.log(`[Database Backup] Successfully created snapshot at: ${outFile}`);
  } catch (err: any) {
    console.error('[Database Backup Error]:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

backup();
