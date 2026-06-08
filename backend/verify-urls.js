const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const urls = [];

  // Collect all Cloudinary URLs
  const settings = await prisma.setting.findMany();
  settings.forEach(s => {
    if (s.value && s.value.startsWith('http')) {
      urls.push({ table: 'Setting', id: s.id, key: s.key, url: s.value });
    }
  });

  const brochures = await prisma.brochure.findMany();
  brochures.forEach(b => {
    if (b.file_path && b.file_path.startsWith('http')) {
      urls.push({ table: 'Brochure', id: b.id, key: b.title, url: b.file_path });
    }
  });

  const documents = await prisma.document.findMany();
  documents.forEach(d => {
    if (d.file_path && d.file_path.startsWith('http')) {
      urls.push({ table: 'Document', id: d.id, key: d.type, url: d.file_path });
    }
  });

  console.log(`Found ${urls.length} Cloudinary URLs to verify...\n`);

  let okCount = 0;
  let failCount = 0;

  for (const item of urls) {
    try {
      const resp = await fetch(item.url, { method: 'HEAD' });
      const status = resp.status;
      if (status === 200) {
        console.log(`  ✅ [${item.table}] ${item.key} (id:${item.id}) - OK`);
        okCount++;
      } else {
        console.log(`  ❌ [${item.table}] ${item.key} (id:${item.id}) - HTTP ${status}`);
        console.log(`     URL: ${item.url}`);
        failCount++;
      }
    } catch (err) {
      console.log(`  ❌ [${item.table}] ${item.key} (id:${item.id}) - ERROR: ${err.message}`);
      console.log(`     URL: ${item.url}`);
      failCount++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total: ${urls.length} | OK: ${okCount} | Failed: ${failCount}`);

  // Check local paths that need migration
  console.log('\n--- Local Paths Needing Migration ---');
  settings.forEach(s => {
    if (s.value && !s.value.startsWith('http') && (s.key.includes('path') || s.key.includes('image') || s.key.includes('logo') || s.key.includes('favicon'))) {
      console.log(`  ⚠️  [Setting] ${s.key} (id:${s.id}): ${s.value}`);
    }
  });
  brochures.forEach(b => {
    if (b.file_path && !b.file_path.startsWith('http')) {
      console.log(`  ⚠️  [Brochure] ${b.title} (id:${b.id}): ${b.file_path}`);
    }
  });
  documents.forEach(d => {
    if (d.file_path && !d.file_path.startsWith('http')) {
      console.log(`  ⚠️  [Document] ${d.type} (id:${d.id}): ${d.file_path}`);
    }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
