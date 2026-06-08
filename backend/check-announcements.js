const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const announcements = await prisma.announcement.findMany();
  console.log('--- Announcements ---');
  announcements.forEach(a => {
    console.log(JSON.stringify({
      id: a.id,
      title: a.title,
      cover_image: a.cover_image,
      attachment_file: a.attachment_file,
      attachment_type: a.attachment_type
    }));
  });
  
  // Also check ALL settings
  const settings = await prisma.setting.findMany();
  console.log('\n--- All Settings ---');
  settings.forEach(s => {
    console.log(JSON.stringify({ id: s.id, key: s.key, value: s.value }));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
