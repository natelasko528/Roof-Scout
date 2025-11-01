const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  const svgPath = path.join(__dirname, 'src/assets/icons/icon.svg');
  const iconsDir = path.join(__dirname, 'src/assets/icons');

  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ Created icon-${size}x${size}.png`);
  }

  console.log('\nAll PWA icons generated successfully!');
  console.log('Icons location:', iconsDir);
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
