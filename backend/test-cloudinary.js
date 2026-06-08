const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'da5mujqqo',
  api_key: '866397911878491',
  api_secret: 'ZJnhx39emMU14AcEfkDKfCGmNVs'
});

async function test() {
  try {
    console.log('Testing Cloudinary upload...');
    const result = await cloudinary.uploader.upload('backend/test.png', {
      folder: 'test'
    });
    console.log('Upload success:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

test();
