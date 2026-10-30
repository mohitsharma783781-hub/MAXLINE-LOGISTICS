import { prisma } from '../src/db';

async function main() {
  console.log('[DB Migration]: Creating public.b2b_quotes table in Supabase Postgres...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.b2b_quotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quote_token VARCHAR(100) UNIQUE NOT NULL,
      merchant_id VARCHAR(100),
      courier_id VARCHAR(50) NOT NULL,
      courier_name VARCHAR(100) NOT NULL,
      service_id VARCHAR(100) NOT NULL,
      service_name VARCHAR(100) NOT NULL,
      rate_card_id UUID NOT NULL,
      rate_card_name VARCHAR(255) NOT NULL,
      rate_card_version VARCHAR(50) NOT NULL DEFAULT 'v1.0',
      origin_pincode VARCHAR(10) NOT NULL,
      destination_pincode VARCHAR(10) NOT NULL,
      origin_zone VARCHAR(50) NOT NULL,
      destination_zone VARCHAR(50) NOT NULL,
      dead_weight_kg NUMERIC(10, 3) NOT NULL,
      chargeable_weight_kg NUMERIC(10, 3) NOT NULL,
      dimensions JSONB DEFAULT '[]'::jsonb,
      invoice_value_inr NUMERIC(12, 2) DEFAULT 0.00,
      customer_rate_per_kg_inr NUMERIC(10, 2) NOT NULL,
      customer_freight_inr NUMERIC(12, 2) NOT NULL,
      customer_docket_charge_inr NUMERIC(10, 2) NOT NULL,
      customer_fuel_surcharge_inr NUMERIC(10, 2) NOT NULL,
      customer_fuel_surcharge_pct NUMERIC(5, 2) NOT NULL,
      customer_applicable_charges JSONB DEFAULT '[]'::jsonb,
      gst_percent NUMERIC(5, 2) NOT NULL,
      gst_amount_inr NUMERIC(10, 2) NOT NULL,
      final_payable_amount_inr NUMERIC(12, 2) NOT NULL,
      estimated_delivery_days VARCHAR(100),
      has_verified_transit_data BOOLEAN DEFAULT FALSE,
      base_cost_inr NUMERIC(12, 2),
      markup_amount_inr NUMERIC(12, 2),
      gross_margin_percent NUMERIC(5, 2),
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      used_at TIMESTAMPTZ,
      shipment_id VARCHAR(100),
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_b2b_quotes_token ON public.b2b_quotes(quote_token);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_b2b_quotes_merchant ON public.b2b_quotes(merchant_id);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_b2b_quotes_expires ON public.b2b_quotes(expires_at);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_b2b_quotes_status ON public.b2b_quotes(status);
  `);

  console.log('[DB Migration]: public.b2b_quotes table and indices created successfully!');
  
  // Verify with a SELECT query
  const count: any = await prisma.$queryRawUnsafe(`SELECT count(*) FROM public.b2b_quotes;`);
  console.log('[DB Migration]: Verification count query result:', count);
}

main()
  .catch((e) => {
    console.error('[DB Migration Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
