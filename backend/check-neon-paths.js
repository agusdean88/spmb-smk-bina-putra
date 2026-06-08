const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const prisma = new PrismaClient();

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  const settings = await prisma.setting.findMany({
    where: {
      key: { in: ['school_logo', 'favicon', 'hero_image'] }
    }
  });
  console.log('--- Settings ---');
  console.log(settings);

  const brochures = await prisma.brochure.findMany();
  console.log('--- Brochures ---');
  console.log(brochures);

  const documents = await prisma.document.findMany();
  console.log('--- Documents ---');
  console.log(documents);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
