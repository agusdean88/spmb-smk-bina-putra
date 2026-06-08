const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\agusg\\.gemini\\antigravity\\scratch\\spmb-smk-bina-putra\\backend\\uploads\\brosur\\brosur_1777856965588.pdf';

try {
  const stats = fs.statSync(filePath);
  console.log('File stats:', stats);
  const fd = fs.openSync(filePath, 'r');
  console.log('File opened successfully');
  fs.closeSync(fd);
} catch (err) {
  console.error('Error reading file:', err);
}
