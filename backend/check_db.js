const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.brochure.findMany().then(b => {
  console.log('Brochures in DB:', JSON.stringify(b, null, 2));
}).catch(console.error).finally(() => prisma.$disconnect());
