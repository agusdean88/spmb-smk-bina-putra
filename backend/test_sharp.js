const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const testImage = path.join(__dirname, 'test.png');
const outputImage = path.join(__dirname, 'test_optimized.png');

// Create a dummy image for testing if doesn't exist
const createTestImage = async () => {
    await sharp({
        create: {
            width: 1000,
            height: 1000,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 0.5 }
        }
    })
    .png()
    .toFile(testImage);
};

const runTest = async () => {
    try {
        if (!fs.existsSync(testImage)) {
            await createTestImage();
        }
        
        console.log('Processing test image...');
        await sharp(testImage)
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .sharpen()
            .png({ quality: 90 })
            .toFile(outputImage);
            
        const metadata = await sharp(outputImage).metadata();
        console.log('Optimized Metadata:', metadata);
        
        if (metadata.width === 512 && metadata.height === 512) {
            console.log('Sharp processing SUCCESS');
        } else {
            console.log('Sharp processing FAILED (incorrect dimensions)');
        }
    } catch (error) {
        console.error('Sharp test error:', error);
    }
};

runTest();
