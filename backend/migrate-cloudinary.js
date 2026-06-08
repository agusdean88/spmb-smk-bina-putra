const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFileToCloudinary = (filePath, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder: folder,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
};

async function main() {
  console.log('=== COMPREHENSIVE MIGRATION & FIX SCRIPT ===\n');

  // ============================================================
  // PHASE 1: Fix broken Cloudinary URLs (HTTP 401 on PDFs)
  // PDF files need /raw/upload/ instead of /image/upload/
  // ============================================================
  console.log('--- Phase 1: Fix broken PDF URLs (image/upload -> raw/upload) ---\n');

  const brokenUrls = [
    { table: 'Brochure', id: 1, field: 'file_path', url: 'https://res.cloudinary.com/da5mujqqo/image/upload/v1780900687/spmb/brosur/k7nmnba49ewsj9apdzdi.pdf' },
    { table: 'Document', id: 18, field: 'file_path', url: 'https://res.cloudinary.com/da5mujqqo/image/upload/v1780900693/spmb/documents/m9ucw20w3mj6mgxk7eny.pdf' },
    { table: 'Document', id: 19, field: 'file_path', url: 'https://res.cloudinary.com/da5mujqqo/image/upload/v1780900694/spmb/documents/gpzbpydhpidzlzwzdcnh.pdf' },
    { table: 'Document', id: 20, field: 'file_path', url: 'https://res.cloudinary.com/da5mujqqo/image/upload/v1780900695/spmb/documents/akimno8camjitwdu0qyu.pdf' },
  ];

  for (const item of brokenUrls) {
    const fixedUrl = item.url.replace('/image/upload/', '/raw/upload/');
    
    // Verify the fixed URL works
    try {
      const resp = await fetch(fixedUrl, { method: 'HEAD' });
      if (resp.status === 200) {
        console.log(`  ✅ Fixed URL works: ${fixedUrl}`);
        
        // Update database
        if (item.table === 'Brochure') {
          await prisma.brochure.update({
            where: { id: item.id },
            data: { file_path: fixedUrl }
          });
        } else if (item.table === 'Document') {
          await prisma.document.update({
            where: { id: item.id },
            data: { file_path: fixedUrl }
          });
        }
        console.log(`     ✅ Updated ${item.table} id:${item.id} in database`);
      } else {
        console.log(`  ⚠️  Fixed URL still failing (HTTP ${resp.status}), will re-upload from local`);
        // Will handle re-upload in Phase 2
      }
    } catch (err) {
      console.log(`  ❌ Error checking fixed URL: ${err.message}`);
    }
  }

  // ============================================================
  // PHASE 2: Migrate remaining local paths
  // ============================================================
  console.log('\n--- Phase 2: Migrate remaining local paths ---\n');

  // Fix brochure_path setting (id:3)
  const brochureSetting = await prisma.setting.findFirst({ where: { key: 'brochure_path' } });
  if (brochureSetting && !brochureSetting.value.startsWith('http')) {
    const localPath = path.join(__dirname, brochureSetting.value);
    console.log(`  Found local brochure_path: ${brochureSetting.value}`);
    
    if (fs.existsSync(localPath)) {
      console.log(`  Uploading ${localPath} to Cloudinary...`);
      const result = await uploadFileToCloudinary(localPath, 'spmb/brosur');
      // Use raw URL for PDF
      const cloudUrl = result.secure_url.replace('/image/upload/', '/raw/upload/');
      await prisma.setting.update({
        where: { id: brochureSetting.id },
        data: { value: cloudUrl }
      });
      console.log(`  ✅ Updated brochure_path to: ${cloudUrl}`);
    } else {
      console.log(`  ⚠️  Local file not found: ${localPath}`);
      // Check if a Cloudinary version already exists (from brochure table)
      const existingBrochure = await prisma.brochure.findFirst({ where: { is_active: true } });
      if (existingBrochure && existingBrochure.file_path.startsWith('http')) {
        await prisma.setting.update({
          where: { id: brochureSetting.id },
          data: { value: existingBrochure.file_path }
        });
        console.log(`  ✅ Updated brochure_path using existing brochure URL: ${existingBrochure.file_path}`);
      }
    }
  }

  // ============================================================
  // PHASE 3: Upload any remaining local files in uploads/ that 
  // are referenced by documents with local paths
  // ============================================================
  console.log('\n--- Phase 3: Check for any remaining local document paths ---\n');
  
  const allDocs = await prisma.document.findMany();
  let localDocCount = 0;
  for (const d of allDocs) {
    if (d.file_path && !d.file_path.startsWith('http')) {
      localDocCount++;
      const localPath = path.join(__dirname, d.file_path);
      if (fs.existsSync(localPath)) {
        console.log(`  Uploading document ${d.type} (id:${d.id}): ${localPath}`);
        const result = await uploadFileToCloudinary(localPath, 'spmb/documents');
        let cloudUrl = result.secure_url;
        // Fix PDF URLs
        if (d.file_path.endsWith('.pdf')) {
          cloudUrl = cloudUrl.replace('/image/upload/', '/raw/upload/');
        }
        await prisma.document.update({
          where: { id: d.id },
          data: { file_path: cloudUrl }
        });
        console.log(`  ✅ Uploaded and updated document id:${d.id}`);
      } else {
        console.warn(`  ⚠️  File not found: ${localPath}`);
      }
    }
  }
  if (localDocCount === 0) {
    console.log('  ✅ All document paths are already Cloudinary URLs');
  }

  // ============================================================
  // PHASE 4: Final verification
  // ============================================================
  console.log('\n--- Phase 4: Final Verification ---\n');
  
  const finalSettings = await prisma.setting.findMany();
  const finalBrochures = await prisma.brochure.findMany();
  const finalDocs = await prisma.document.findMany();
  
  let allUrls = [];
  finalSettings.forEach(s => {
    if (s.value && s.value.startsWith('http')) {
      allUrls.push({ table: 'Setting', id: s.id, key: s.key, url: s.value });
    }
  });
  finalBrochures.forEach(b => {
    if (b.file_path && b.file_path.startsWith('http')) {
      allUrls.push({ table: 'Brochure', id: b.id, key: b.title, url: b.file_path });
    }
  });
  finalDocs.forEach(d => {
    if (d.file_path && d.file_path.startsWith('http')) {
      allUrls.push({ table: 'Document', id: d.id, key: d.type, url: d.file_path });
    }
  });

  let okCount = 0;
  let failCount = 0;
  
  for (const item of allUrls) {
    try {
      const resp = await fetch(item.url, { method: 'HEAD' });
      if (resp.status === 200) {
        console.log(`  ✅ [${item.table}] ${item.key} (id:${item.id}) - OK`);
        okCount++;
      } else {
        console.log(`  ❌ [${item.table}] ${item.key} (id:${item.id}) - HTTP ${resp.status}`);
        console.log(`     URL: ${item.url}`);
        failCount++;
      }
    } catch (err) {
      console.log(`  ❌ [${item.table}] ${item.key} (id:${item.id}) - ERROR: ${err.message}`);
      failCount++;
    }
  }

  // Check for any remaining local paths
  let remainingLocal = 0;
  finalSettings.forEach(s => {
    if ((s.key.includes('path') || s.key.includes('image') || s.key.includes('logo') || s.key.includes('favicon')) && s.value && !s.value.startsWith('http')) {
      console.log(`  ⚠️  Local path remaining: [Setting] ${s.key}: ${s.value}`);
      remainingLocal++;
    }
  });
  finalBrochures.forEach(b => {
    if (b.file_path && !b.file_path.startsWith('http')) {
      console.log(`  ⚠️  Local path remaining: [Brochure] ${b.title}: ${b.file_path}`);
      remainingLocal++;
    }
  });
  finalDocs.forEach(d => {
    if (d.file_path && !d.file_path.startsWith('http')) {
      console.log(`  ⚠️  Local path remaining: [Document] ${d.type}: ${d.file_path}`);
      remainingLocal++;
    }
  });

  console.log(`\n=== MIGRATION COMPLETE ===`);
  console.log(`Cloudinary URLs: ${allUrls.length} total | ${okCount} OK | ${failCount} Failed`);
  console.log(`Remaining local paths: ${remainingLocal}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
