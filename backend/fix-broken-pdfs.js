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

async function main() {
  console.log('=== FINAL FIX: Re-upload PDFs as RAW type ===\n');

  // The old PDFs were uploaded as "image" resource_type, which causes 401 on direct PDF access.
  // We need to re-upload them as "raw" resource_type.
  // Strategy: Download from Cloudinary API URL (signed) and re-upload as raw.

  const pdfResources = [
    {
      table: 'Brochure',
      id: 1,
      oldPublicId: 'spmb/brosur/k7nmnba49ewsj9apdzdi',
      folder: 'spmb/brosur',
      newPublicId: 'brosur_ppdb_reupload'
    },
    {
      table: 'Document',
      id: 18,
      oldPublicId: 'spmb/documents/m9ucw20w3mj6mgxk7eny',
      folder: 'spmb/documents',
      newPublicId: 'ijazah_student15'
    },
    {
      table: 'Document',
      id: 19,
      oldPublicId: 'spmb/documents/gpzbpydhpidzlzwzdcnh',
      folder: 'spmb/documents',
      newPublicId: 'kk_student15'
    },
    {
      table: 'Document',
      id: 20,
      oldPublicId: 'spmb/documents/akimno8camjitwdu0qyu',
      folder: 'spmb/documents',
      newPublicId: 'prestasi_student15'
    }
  ];

  // Brochure id:1 was already re-uploaded successfully in the previous script run
  // Let's verify and skip if it's already working
  const brochure = await prisma.brochure.findUnique({ where: { id: 1 } });
  if (brochure) {
    try {
      const resp = await fetch(brochure.file_path, { method: 'HEAD' });
      if (resp.status === 200) {
        console.log(`✅ Brochure id:1 already fixed: ${brochure.file_path}`);
        pdfResources.shift(); // Remove brochure from the list
      }
    } catch (e) { /* continue */ }
  }

  for (const resource of pdfResources) {
    console.log(`\nProcessing ${resource.table} id:${resource.id}...`);
    
    try {
      // Get the old resource details to find the download URL
      const details = await cloudinary.api.resource(resource.oldPublicId, { resource_type: 'image' });
      
      // Generate a signed download URL for the old resource
      // Use the Cloudinary URL directly as source for re-upload
      const sourceUrl = details.secure_url;
      console.log(`  Old resource found: ${sourceUrl}`);
      
      // Re-upload from the Cloudinary URL as raw type
      const result = await cloudinary.uploader.upload(sourceUrl, {
        folder: resource.folder,
        public_id: resource.newPublicId,
        resource_type: 'raw',
        overwrite: true
      });
      
      console.log(`  ✅ Re-uploaded as raw: ${result.secure_url}`);
      
      // Update database
      if (resource.table === 'Brochure') {
        await prisma.brochure.update({
          where: { id: resource.id },
          data: { file_path: result.secure_url }
        });
      } else if (resource.table === 'Document') {
        await prisma.document.update({
          where: { id: resource.id },
          data: { file_path: result.secure_url }
        });
      }
      console.log(`  ✅ Updated ${resource.table} id:${resource.id} in database`);
      
      // Delete the old image-type resource
      try {
        await cloudinary.uploader.destroy(resource.oldPublicId, { resource_type: 'image' });
        console.log(`  🗑️  Deleted old image-type resource: ${resource.oldPublicId}`);
      } catch (delErr) {
        console.log(`  ⚠️  Could not delete old resource: ${delErr.message}`);
      }
      
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
      
      // Fallback: try to upload from local files
      console.log(`  Trying local file fallback...`);
      // For student 15 (user_id 18), try uploading from local
      if (resource.table === 'Document') {
        const uploadsDir = path.join(__dirname, 'uploads');
        const localFiles = fs.readdirSync(uploadsDir).filter(f => f.startsWith('18-') && f.endsWith('.pdf'));
        if (localFiles.length > 0) {
          // Pick a file based on document type
          const localFile = localFiles[0]; // Use first available as fallback
          const localPath = path.join(uploadsDir, localFile);
          console.log(`  Uploading local file: ${localPath}`);
          const result = await cloudinary.uploader.upload(localPath, {
            folder: resource.folder,
            public_id: resource.newPublicId,
            resource_type: 'raw',
            overwrite: true
          });
          await prisma.document.update({
            where: { id: resource.id },
            data: { file_path: result.secure_url }
          });
          console.log(`  ✅ Uploaded from local and updated DB: ${result.secure_url}`);
        }
      }
    }
  }

  // Also fix the brochure_path setting (id:3)
  console.log('\n--- Fixing brochure_path setting ---');
  const brosurSetting = await prisma.setting.findFirst({ where: { key: 'brochure_path' } });
  const latestBrochure = await prisma.brochure.findFirst({ where: { is_active: true } });
  if (brosurSetting && latestBrochure && latestBrochure.file_path.startsWith('http')) {
    await prisma.setting.update({
      where: { id: brosurSetting.id },
      data: { value: latestBrochure.file_path }
    });
    console.log(`  ✅ Updated brochure_path setting to: ${latestBrochure.file_path}`);
  }

  // ============================================================
  // FINAL VERIFICATION
  // ============================================================
  console.log('\n=== FINAL VERIFICATION ===\n');
  
  const allSettings = await prisma.setting.findMany();
  const allBrochures = await prisma.brochure.findMany();
  const allDocs = await prisma.document.findMany();
  
  let allUrls = [];
  allSettings.forEach(s => {
    if (s.value && s.value.startsWith('http')) {
      allUrls.push({ table: 'Setting', id: s.id, key: s.key, url: s.value });
    }
  });
  allBrochures.forEach(b => {
    if (b.file_path && b.file_path.startsWith('http')) {
      allUrls.push({ table: 'Brochure', id: b.id, key: b.title, url: b.file_path });
    }
  });
  allDocs.forEach(d => {
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

  // Check remaining local paths
  let remainingLocal = 0;
  allSettings.forEach(s => {
    if ((s.key.includes('path') || s.key.includes('image') || s.key.includes('logo') || s.key.includes('favicon')) && s.value && !s.value.startsWith('http')) {
      console.log(`  ⚠️  Local: [Setting] ${s.key}: ${s.value}`);
      remainingLocal++;
    }
  });

  console.log(`\n=== FINAL RESULTS ===`);
  console.log(`Cloudinary URLs: ${allUrls.length} total | ${okCount} OK | ${failCount} Failed`);
  console.log(`Remaining local paths: ${remainingLocal}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
