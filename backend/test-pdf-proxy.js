require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { extractPublicId, extractResourceType, cloudinary } = require('./lib/cloudinary');
const zlib = require('zlib');

async function test() {
  const testUrl = 'https://res.cloudinary.com/da5mujqqo/image/upload/v1780900687/spmb/brosur/k7nmnba49ewsj9apdzdi.pdf';
  
  const publicId = extractPublicId(testUrl);
  const resourceType = extractResourceType(testUrl);
  
  const zipUrl = cloudinary.utils.download_zip_url({
    public_ids: [publicId],
    resource_type: resourceType,
    target_format: 'zip',
    flatten_folders: true
  });
  
  console.log('Downloading ZIP...');
  const resp = await fetch(zipUrl);
  const buffer = Buffer.from(await resp.arrayBuffer());
  console.log('ZIP size:', buffer.length, 'bytes');
  
  // Parse the general purpose bit flag
  const generalPurpose = buffer.readUInt16LE(6);
  const hasDataDescriptor = (generalPurpose & 0x08) !== 0;
  console.log('Has data descriptor:', hasDataDescriptor);
  
  const compressionMethod = buffer.readUInt16LE(8);
  let compressedSize = buffer.readUInt32LE(18);
  let uncompressedSize = buffer.readUInt32LE(22);
  const filenameLength = buffer.readUInt16LE(26);
  const extraFieldLength = buffer.readUInt16LE(28);
  const filename = buffer.subarray(30, 30 + filenameLength).toString('utf8');
  
  console.log('Compression:', compressionMethod);
  console.log('Header compressed size:', compressedSize);
  console.log('Header uncompressed size:', uncompressedSize);
  console.log('Filename:', filename);
  
  const dataOffset = 30 + filenameLength + extraFieldLength;
  console.log('Data offset:', dataOffset);
  
  if (hasDataDescriptor && compressedSize === 0) {
    // Need to find the data descriptor or central directory to get the actual size
    // Look for central directory signature: PK\x01\x02 (0x02014b50)
    let centralDirOffset = -1;
    for (let i = dataOffset; i < buffer.length - 4; i++) {
      if (buffer[i] === 0x50 && buffer[i+1] === 0x4B && 
          buffer[i+2] === 0x01 && buffer[i+3] === 0x02) {
        centralDirOffset = i;
        break;
      }
    }
    
    if (centralDirOffset > 0) {
      console.log('Central directory at:', centralDirOffset);
      
      // But first check for data descriptor right before central directory
      // Data descriptor: may have signature PK\x07\x08 (optional), then crc32(4), compressed(4), uncompressed(4)
      // The compressed data is from dataOffset to just before data descriptor
      
      // Check if there's a data descriptor signature
      let descOffset = centralDirOffset;
      // Search backward for data descriptor
      for (let i = centralDirOffset - 16; i < centralDirOffset; i++) {
        if (buffer[i] === 0x50 && buffer[i+1] === 0x4B && 
            buffer[i+2] === 0x07 && buffer[i+3] === 0x08) {
          descOffset = i;
          console.log('Data descriptor signature at:', descOffset);
          compressedSize = buffer.readUInt32LE(descOffset + 8);
          uncompressedSize = buffer.readUInt32LE(descOffset + 12);
          console.log('Actual compressed size:', compressedSize);
          console.log('Actual uncompressed size:', uncompressedSize);
          break;
        }
      }
      
      if (compressedSize === 0) {
        // No data descriptor found, calculate from central directory
        // Read sizes from central directory entry
        compressedSize = buffer.readUInt32LE(centralDirOffset + 20);
        uncompressedSize = buffer.readUInt32LE(centralDirOffset + 24);
        console.log('From central dir - compressed:', compressedSize, 'uncompressed:', uncompressedSize);
      }
    }
  }
  
  // Now extract
  const compressedData = buffer.subarray(dataOffset, dataOffset + compressedSize);
  console.log('\nCompressed data size:', compressedData.length);
  
  let pdfBuffer;
  if (compressionMethod === 0) {
    pdfBuffer = compressedData;
  } else if (compressionMethod === 8) {
    pdfBuffer = zlib.inflateRawSync(compressedData);
  }
  
  if (pdfBuffer) {
    console.log('✅ Extracted PDF size:', pdfBuffer.length, 'bytes');
    console.log('First bytes:', pdfBuffer.subarray(0, 10).toString('utf8'));
    console.log('Is valid PDF:', pdfBuffer.subarray(0, 4).toString('utf8') === '%PDF');
  }
}

test().catch(console.error);
