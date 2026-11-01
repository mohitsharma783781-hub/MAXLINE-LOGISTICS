const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.$queryRaw`SELECT id, email, encrypted_password FROM auth.users`;
  const candidates = [
    'Mohit@#142414',
    'Maxline@2026',
    'Seller@Maxline2026',
    'seller123',
    'admin123',
    'mohit123',
    'Mohit123',
    'mohit@123',
    'Mohit@123',
    '123456',
    '12345678',
    'password',
    'Password@123',
    '7009174879',
    '7009311318',
    'mohitsharma',
    'Mohitsharma',
    'Mohit@2026'
  ];

  for (const u of users) {
    console.log('Testing user:', u.email);
    for (const c of candidates) {
      if (u.encrypted_password && bcrypt.compareSync(c, u.encrypted_password)) {
        console.log('  >>> MATCH FOUND for', u.email, 'Password is:', c);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
