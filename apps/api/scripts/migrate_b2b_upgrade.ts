import { prisma } from '../src/db';

async function migrate() {
  console.log('Adding flexible B2B rate management & markup columns to carrier_rate_cards...');

  const statements = [
    `ALTER TABLE public.carrier_rate_cards ADD COLUMN IF NOT EXISTS card_type VARCHAR(50) DEFAULT 'BASE_COST';`,
    `ALTER TABLE public.carrier_rate_cards ADD COLUMN IF NOT EXISTS markup_type VARCHAR(50) DEFAULT 'NONE';`,
    `ALTER TABLE public.carrier_rate_cards ADD COLUMN IF NOT EXISTS markup_value NUMERIC(10,2) DEFAULT 0.00;`,
    `ALTER TABLE public.carrier_rate_cards ADD COLUMN IF NOT EXISTS parent_cost_card_id UUID NULL;`,
    `ALTER TABLE public.carrier_rate_cards ADD COLUMN IF NOT EXISTS zone_coverage JSONB DEFAULT '{}'::jsonb;`,
    `ALTER TABLE public.carrier_rate_cards ADD COLUMN IF NOT EXISTS pincode_zone_mapping JSONB DEFAULT '{}'::jsonb;`
  ];

  for (const sql of statements) {
    console.log('Executing:', sql);
    await prisma.$executeRawUnsafe(sql);
  }

  console.log('✓ Migration executed successfully.');
  await prisma.$disconnect();
}

migrate().catch(console.error);
