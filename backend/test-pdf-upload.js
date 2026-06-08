const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'da5mujqqo',
  api_key: '866397911878491',
  api_secret: 'ZJnhx39emMU14AcEfkDKfCGmNVs'
});

async function run() {
  try {
    console.log('Uploading PDF as raw...');
    const res = await cloudinary.uploader.upload('backend/uploads/brosur/brosur_1778305619346.pdf', {
      folder: 'spmb/brosur_test',
      resource_type: 'raw'
    });
    console.log('Upload result:', res);
  } catch (err) {
    console.error('Upload failed:', err);
  }
}

run();
