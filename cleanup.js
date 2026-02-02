import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const itemsToDelete = [
  'backend',
  'render.yaml',
  'services/mockDb.ts',
  'CLEAR_CART_FIX_REPORT.md',
  'APP_ARCHITECTURE_AND_GUIDE.md',
  '.next',
  'node_modules',
  'package-lock.json',
  'yarn.lock'
];

console.log('🧹 Starting cleanup...');

itemsToDelete.forEach(item => {
  const targetPath = path.join(__dirname, item);
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      console.log(`✅ Deleted: ${item}`);
    } else {
      console.log(`⚠️ Skipped (not found): ${item}`);
    }
  } catch (err) {
    console.error(`❌ Failed to delete ${item}:`, err.message);
  }
});

console.log('✨ Cleanup complete! Please run "npm install" and "npm run dev" to start fresh.');

// Self-destruct this script
try {
    fs.rmSync(fileURLToPath(import.meta.url));
    console.log('🗑️  Cleanup script removed.');
} catch (e) {
    console.log('You can now delete this file.');
}