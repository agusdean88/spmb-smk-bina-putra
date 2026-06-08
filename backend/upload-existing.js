const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// Load environment variables from various local .env files
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const prisma = new PrismaClient();

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

async function migrateUploads() {
  try {
    console.log('Starting migration of existing uploads to Cloudinary...');
    
    // 1. Migrate brochures
    const brochures = await prisma.brochure.findMany();
    for (const b of brochures) {
      if (b.file_path && !b.file_path.startsWith('http')) {
        const localPath = path.join(__dirname, b.file_path);
        if (fs.existsSync(localPath)) {
          console.log(`Uploading brochure: ${localPath}`);
          const res = await uploadFileToCloudinary(localPath, 'spmb/brosur');
          await prisma.brochure.update({
            where: { id: b.id },
            data: { file_path: res.secure_url }
          });
          console.log(`Updated brochure path to: ${res.secure_url}`);
        } else {
          console.warn(`File not found: ${localPath}`);
        }
      }
    }

    // 2. Migrate logo, favicon and hero in Settings
    const settings = await prisma.setting.findMany();
    for (const s of settings) {
      if ((s.key === 'school_logo' || s.key === 'favicon' || s.key === 'hero_image') && s.value && !s.value.startsWith('http')) {
        const localPath = path.join(__dirname, s.value);
        if (fs.existsSync(localPath)) {
          console.log(`Uploading setting ${s.key}: ${localPath}`);
          const folder = s.key === 'hero_image' ? 'spmb/hero' : 'spmb/logo';
          const res = await uploadFileToCloudinary(localPath, folder);
          await prisma.setting.update({
            where: { id: s.id },
            data: { value: res.secure_url }
          });
          console.log(`Updated setting ${s.key} path to: ${res.secure_url}`);
        } else {
          console.warn(`File not found: ${localPath}`);
        }
      }
    }

    // 3. Migrate student documents
    const documents = await prisma.document.findMany();
    for (const d of documents) {
      if (d.file_path && !d.file_path.startsWith('http')) {
        const localPath = path.join(__dirname, d.file_path);
        if (fs.existsSync(localPath)) {
          console.log(`Uploading student document: ${localPath}`);
          const res = await uploadFileToCloudinary(localPath, 'spmb/documents');
          await prisma.document.update({
            where: { id: d.id },
            data: { file_path: res.secure_url }
          });
          console.log(`Updated document path to: ${res.secure_url}`);
        } else {
          console.warn(`File not found: ${localPath}`);
        }
      }
    }

    console.log('Existing uploads migration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrateUploads();
