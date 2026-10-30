const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const members = await prisma.$queryRaw`SELECT * FROM public.merchant_members`;
  console.log('MERCHANT MEMBERS:', JSON.stringify(members, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
