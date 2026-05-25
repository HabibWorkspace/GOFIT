import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const publicDir = 'public';

async function optimizeImages() {
  console.log('🖼️  Optimizing images...\n');

  // Optimize logo.PNG
  try {
    console.log('Optimizing logo.PNG...');
    await sharp(join(publicDir, 'logo.PNG'))
      .resize(800, null, { // Max width 800px, maintain aspect ratio
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality: 85 }) // Convert to WebP
      .toFile(join(publicDir, 'logo.webp'));
    
    // Also create optimized PNG version
    await sharp(join(publicDir, 'logo.PNG'))
      .resize(800, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(join(publicDir, 'logo-optimized.png'));
    
    console.log('✅ logo.PNG optimized');
  } catch (err) {
    console.error('❌ Error optimizing logo:', err.message);
  }

  // Optimize receipt.png
  try {
    console.log('Optimizing reciept.png...');
    await sharp(join(publicDir, 'reciept.png'))
      .resize(1200, null, { // Max width 1200px
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality: 80 })
      .toFile(join(publicDir, 'reciept.webp'));
    
    // Also create optimized PNG version
    await sharp(join(publicDir, 'reciept.png'))
      .resize(1200, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .png({ quality: 75, compressionLevel: 9 })
      .toFile(join(publicDir, 'reciept-optimized.png'));
    
    console.log('✅ reciept.png optimized');
  } catch (err) {
    console.error('❌ Error optimizing receipt:', err.message);
  }

  console.log('\n📊 Optimization complete!');
  console.log('WebP versions created for modern browsers');
  console.log('Optimized PNG versions created as fallback');
}

optimizeImages();
