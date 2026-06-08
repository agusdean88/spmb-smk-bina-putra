const cloudinary = require('cloudinary').v2;
const zlib = require('zlib');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Check if a URL is a Cloudinary URL
 */
const isCloudinaryUrl = (url) => {
  return url && typeof url === 'string' && url.includes('res.cloudinary.com');
};

/**
 * Check if a Cloudinary URL points to a PDF file
 */
const isCloudinaryPdf = (url) => {
  return isCloudinaryUrl(url) && url.toLowerCase().endsWith('.pdf');
};

/**
 * Extract the public_id from a Cloudinary URL (without extension).
 * e.g., https://res.cloudinary.com/da5mujqqo/image/upload/v1780900687/spmb/brosur/file.pdf
 * => spmb/brosur/file
 */
const extractPublicId = (url) => {
  if (!isCloudinaryUrl(url)) return null;
  
  const match = url.match(/\/(?:image|raw|video)\/(?:upload|authenticated)\/(?:s--[^/]+--\/)?(?:v\d+\/)?(.+?)(?:\.[^./]+)?$/);
  if (!match) return null;
  
  return match[1];
};

/**
 * Extract the resource_type from a Cloudinary URL
 */
const extractResourceType = (url) => {
  if (url.includes('/raw/')) return 'raw';
  if (url.includes('/video/')) return 'video';
  return 'image';
};

/**
 * Extract the first file from a ZIP buffer.
 * Handles ZIP files with data descriptors (bit 3 of general purpose flag).
 */
const extractFirstFileFromZip = (zipBuffer) => {
  try {
    // Verify ZIP signature: PK\x03\x04
    if (zipBuffer[0] !== 0x50 || zipBuffer[1] !== 0x4B || 
        zipBuffer[2] !== 0x03 || zipBuffer[3] !== 0x04) {
      console.error('[ZIP] Invalid ZIP file signature');
      return null;
    }

    const generalPurpose = zipBuffer.readUInt16LE(6);
    const hasDataDescriptor = (generalPurpose & 0x08) !== 0;
    const compressionMethod = zipBuffer.readUInt16LE(8);
    let compressedSize = zipBuffer.readUInt32LE(18);
    let uncompressedSize = zipBuffer.readUInt32LE(22);
    const filenameLength = zipBuffer.readUInt16LE(26);
    const extraFieldLength = zipBuffer.readUInt16LE(28);
    
    const dataOffset = 30 + filenameLength + extraFieldLength;

    // If data descriptor is used, sizes in local header may be 0
    if (hasDataDescriptor && compressedSize === 0) {
      // Find central directory to get actual sizes
      // Central directory signature: PK\x01\x02 (0x02014b50)
      for (let i = dataOffset; i < zipBuffer.length - 4; i++) {
        if (zipBuffer[i] === 0x50 && zipBuffer[i+1] === 0x4B && 
            zipBuffer[i+2] === 0x01 && zipBuffer[i+3] === 0x02) {
          // Found central directory, but first check for data descriptor
          // Data descriptor signature: PK\x07\x08
          for (let j = i - 16; j < i; j++) {
            if (j >= 0 && zipBuffer[j] === 0x50 && zipBuffer[j+1] === 0x4B && 
                zipBuffer[j+2] === 0x07 && zipBuffer[j+3] === 0x08) {
              compressedSize = zipBuffer.readUInt32LE(j + 8);
              uncompressedSize = zipBuffer.readUInt32LE(j + 12);
              break;
            }
          }
          // Fallback: read from central directory entry
          if (compressedSize === 0) {
            compressedSize = zipBuffer.readUInt32LE(i + 20);
            uncompressedSize = zipBuffer.readUInt32LE(i + 24);
          }
          break;
        }
      }
    }

    if (compressedSize === 0 || dataOffset + compressedSize > zipBuffer.length) {
      console.error('[ZIP] Invalid compressed data size');
      return null;
    }

    const compressedData = zipBuffer.subarray(dataOffset, dataOffset + compressedSize);

    if (compressionMethod === 0) {
      // Stored (no compression)
      return compressedData;
    } else if (compressionMethod === 8) {
      // Deflate
      return zlib.inflateRawSync(compressedData);
    } else {
      console.error('[ZIP] Unsupported compression method:', compressionMethod);
      return null;
    }
  } catch (err) {
    console.error('[ZIP] Extraction error:', err.message);
    return null;
  }
};

/**
 * Proxy a Cloudinary PDF through the backend.
 * Downloads the file from Cloudinary's archive API and streams it to the response.
 * This bypasses the 401 restriction on Cloudinary Free plan for PDF files.
 * 
 * @param {string} cloudinaryUrl - The Cloudinary URL of the PDF
 * @param {object} res - Express response object
 * @param {string} filename - The filename for Content-Disposition header
 * @param {boolean} download - If true, force download; if false, inline display
 */
const proxyCloudinaryPdf = async (cloudinaryUrl, res, filename = 'document.pdf', download = false) => {
  const publicId = extractPublicId(cloudinaryUrl);
  const resourceType = extractResourceType(cloudinaryUrl);
  
  if (!publicId) {
    throw new Error('Invalid Cloudinary URL');
  }

  console.log(`[CLOUDINARY PROXY] Downloading PDF: publicId=${publicId}, resourceType=${resourceType}`);

  // Use the archive API to get a downloadable ZIP
  const zipUrl = cloudinary.utils.download_zip_url({
    public_ids: [publicId],
    resource_type: resourceType,
    target_format: 'zip',
    flatten_folders: true
  });
  
  const zipResponse = await fetch(zipUrl);
  if (!zipResponse.ok) {
    throw new Error(`Failed to download from Cloudinary: HTTP ${zipResponse.status}`);
  }

  const zipBuffer = Buffer.from(await zipResponse.arrayBuffer());
  const pdfBuffer = extractFirstFileFromZip(zipBuffer);
  
  if (!pdfBuffer) {
    throw new Error('Failed to extract PDF from Cloudinary archive');
  }

  // Verify it's a valid PDF
  if (pdfBuffer.subarray(0, 4).toString('utf8') !== '%PDF') {
    console.warn('[CLOUDINARY PROXY] Warning: Extracted file does not start with %PDF header');
  }

  console.log(`[CLOUDINARY PROXY] Successfully extracted PDF: ${pdfBuffer.length} bytes`);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', pdfBuffer.length);
  res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${filename}"`);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  res.send(pdfBuffer);
};

module.exports = {
  cloudinary,
  isCloudinaryUrl,
  isCloudinaryPdf,
  extractPublicId,
  extractResourceType,
  proxyCloudinaryPdf
};
