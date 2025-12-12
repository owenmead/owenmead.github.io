/**
 * Image Processing Script for Family Ball Drop Game
 *
 * This script converts family photos into circular game assets
 *
 * Usage:
 *   1. Place your family photos in ./family-photos/ folder
 *   2. Name them in order: person-0.png, person-1.png, ... person-11.png
 *      (Or any name - script will process alphabetically)
 *   3. Run: node process-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  inputDir: './rawFamilyPhotos',
  outputDir: './assets/img',
  outputSize: 1024,  // Output images will be 1024x1024
  imageCount: 13,    // Need 13 images for the game

  // Border settings
  borderWidth: 12,   // Border thickness in pixels
  borderColor: '#FFFFFF',  // Border color (white)
};

/**
 * Create a circular mask for cropping images
 */
async function createCircleMask(size) {
  const svg = `
    <svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
    </svg>
  `;
  return Buffer.from(svg);
}

/**
 * Process a single image: resize, crop to circle, add transparent background
 */
async function processImage(inputPath, outputPath, index) {
  try {
    const size = CONFIG.outputSize;

    console.log(`Processing ${index + 1}/13: ${path.basename(inputPath)}...`);

    // Read the image
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Calculate crop to make it square (centered)
    const minDimension = Math.min(metadata.width, metadata.height);
    const left = Math.floor((metadata.width - minDimension) / 2);
    const top = Math.floor((metadata.height - minDimension) / 2);

    // Create circular mask
    const circleMask = await createCircleMask(size);

    // Process the image:
    // 1. Extract square from center
    // 2. Resize to target size
    // 3. Apply circular mask
    // 4. Add transparent background
    await image
      .extract({
        left: left,
        top: top,
        width: minDimension,
        height: minDimension
      })
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .composite([{
        input: circleMask,
        blend: 'dest-in'
      }])
      .png({ quality: 100 })
      .toFile(outputPath);

    console.log(`  ✓ Saved as ${path.basename(outputPath)}`);
    return true;

  } catch (error) {
    console.error(`  ✗ Error processing ${inputPath}:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🎮 Family Ball Drop - Image Processor\n');

  // Check if input directory exists
  if (!fs.existsSync(CONFIG.inputDir)) {
    console.error(`❌ Error: Input directory "${CONFIG.inputDir}" not found!`);
    console.log('\nPlease create the directory and add your family photos:');
    console.log(`  mkdir ${CONFIG.inputDir}`);
    console.log(`  # Then add 12 images (PNG or JPG) to that folder\n`);
    process.exit(1);
  }

  // Check if output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    console.error(`❌ Error: Output directory "${CONFIG.outputDir}" not found!`);
    process.exit(1);
  }

  // Get all image files from input directory
  const imageFiles = fs.readdirSync(CONFIG.inputDir)
    .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
    .sort();

  if (imageFiles.length === 0) {
    console.error(`❌ No images found in ${CONFIG.inputDir}`);
    console.log('\nSupported formats: PNG, JPG, JPEG');
    process.exit(1);
  }

  if (imageFiles.length < CONFIG.imageCount) {
    console.warn(`⚠️  Warning: Found ${imageFiles.length} images, but game needs ${CONFIG.imageCount}`);
    console.log('   Will process available images. You can add more later.\n');
  }

  if (imageFiles.length > CONFIG.imageCount) {
    console.warn(`⚠️  Warning: Found ${imageFiles.length} images, but game only uses ${CONFIG.imageCount}`);
    console.log('   Will process first 12 images alphabetically.\n');
  }

  // Process images
  console.log(`Found ${imageFiles.length} image(s). Processing...\n`);

  let successCount = 0;
  const imagesToProcess = imageFiles.slice(0, CONFIG.imageCount);

  for (let i = 0; i < imagesToProcess.length; i++) {
    const inputPath = path.join(CONFIG.inputDir, imagesToProcess[i]);
    const outputPath = path.join(CONFIG.outputDir, `ball-${i}.png`);

    const success = await processImage(inputPath, outputPath, i);
    if (success) successCount++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✓ Processed ${successCount}/${imagesToProcess.length} images successfully`);

  if (successCount === CONFIG.imageCount) {
    console.log('\n🎉 All done! Your game is ready with family photos!');
    console.log('   Open index.html to play.\n');
  } else if (successCount > 0) {
    console.log('\n⚠️  Some images were processed successfully.');
    console.log(`   You can add ${CONFIG.imageCount - successCount} more images and run again.\n`);
  } else {
    console.log('\n❌ No images were processed successfully.');
    console.log('   Check the error messages above.\n');
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
