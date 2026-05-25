import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Generate timestamp
const timestamp = Date.now();
console.log(`Building with version: ${timestamp}`);

// Run vite build
console.log('Running vite build...');
execSync('npm run build', { stdio: 'inherit' });

// Replace BUILD_TIMESTAMP in dist/index.html
const indexPath = join(process.cwd(), 'dist', 'index.html');
let indexContent = readFileSync(indexPath, 'utf-8');
indexContent = indexContent.replace(/BUILD_TIMESTAMP/g, timestamp.toString());
writeFileSync(indexPath, indexContent);

console.log(`✅ Build complete with version ${timestamp}`);
console.log('📦 Ready to deploy: dist/');
