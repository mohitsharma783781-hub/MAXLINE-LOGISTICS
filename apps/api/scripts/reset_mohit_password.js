const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const newHash = bcrypt.hashSync('Maxline@2026', 10);
  const updated = await prisma.$executeRaw`UPDATE auth.users SET encrypted_password = ${newHash} WHERE email = 'mohitsharma99229@gmail.com'`;
  console.log('UPDATED PASSWORD ROWS:', updated);
}

main().catch(console.error).finally(() => prisma.$disconnect());
