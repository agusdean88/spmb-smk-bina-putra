const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload file buffer to Cloudinary
const uploadBufferToCloudinary = (buffer, folder, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: path.parse(filename).name.replace(/[^a-zA-Z0-9.-]/g, '_') + '_' + Date.now(),
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

const memoryMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 1. General upload for student documents and data imports
const upload = {
  single: (fieldName) => {
    return [
      memoryMulter.single(fieldName),
      async (req, res, next) => {
        if (!req.file) return next();
        
        // If it's the Excel import route, write temporarily to /tmp for exceljs to read
        if (req.originalUrl && req.originalUrl.includes('/import')) {
          const tempPath = path.join('/tmp', `import_${Date.now()}.xlsx`);
          try {
            fs.writeFileSync(tempPath, req.file.buffer);
            req.file.path = tempPath;
            return next();
          } catch (err) {
            return next(err);
          }
        }
        
        try {
          const result = await uploadBufferToCloudinary(req.file.buffer, 'spmb/documents', req.file.originalname);
          req.file.path = result.secure_url;
          req.file.filename = result.public_id;
          next();
        } catch (err) {
          next(err);
        }
      }
    ];
  }
};

// 2. Specific upload for brochures
const brochureUpload = {
  single: (fieldName) => {
    return [
      memoryMulter.single(fieldName),
      async (req, res, next) => {
        if (!req.file) return next();
        try {
          const result = await uploadBufferToCloudinary(req.file.buffer, 'spmb/brosur', req.file.originalname);
          req.file.path = result.secure_url;
          req.file.filename = result.public_id;
          next();
        } catch (err) {
          next(err);
        }
      }
    ];
  }
};

// 3. Specific upload for hero image
const heroUpload = {
  single: (fieldName) => {
    return [
      memoryMulter.single(fieldName),
      async (req, res, next) => {
        if (!req.file) return next();
        try {
          const result = await uploadBufferToCloudinary(req.file.buffer, 'spmb/hero', req.file.originalname);
          req.file.path = result.secure_url;
          req.file.filename = result.public_id;
          next();
        } catch (err) {
          next(err);
        }
      }
    ];
  }
};

// 4. Specific upload for logo & favicon
const logoUpload = {
  single: (fieldName) => {
    return [
      memoryMulter.single(fieldName),
      async (req, res, next) => {
        if (!req.file) return next();
        // Just pass to the controller, the controller handles Sharp image resizing in memory
        next();
      }
    ];
  }
};

// 5. Specific upload for announcements with subfolders
const announcementUpload = {
  fields: (fieldsArray) => {
    return [
      memoryMulter.fields(fieldsArray),
      async (req, res, next) => {
        if (!req.files) return next();
        try {
          for (const fieldName of Object.keys(req.files)) {
            const files = req.files[fieldName];
            if (files && files[0]) {
              const file = files[0];
              const subfolder = file.mimetype === 'application/pdf' ? 'pdf' : (file.mimetype.includes('sheet') || file.mimetype.includes('excel') ? 'excel' : 'images');
              const result = await uploadBufferToCloudinary(file.buffer, `spmb/announcements/${subfolder}`, file.originalname);
              file.path = result.secure_url;
              file.filename = result.public_id;
            }
          }
          next();
        } catch (err) {
          next(err);
        }
      }
    ];
  }
};

module.exports = {
  upload,
  brochureUpload,
  heroUpload,
  logoUpload,
  announcementUpload,
  uploadBufferToCloudinary // Export this for the controller to use
};
