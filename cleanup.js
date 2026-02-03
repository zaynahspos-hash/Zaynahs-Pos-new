import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const itemsToDelete = [
  'backend',           // Legacy backend folder
  'api',               // Deprecated API folder
  'server.ts',         // Deprecated Express server
  'test-connection.js',// MongoDB test script
  'services/api.ts',   // Deprecated API service
  'services/mockDb.ts',// Mock database
  'render.yaml',       // Render deployment config
  'CLEAR_CART_FIX_REPORT.md',
  'APP_ARCHITECTURE_AND_GUIDE.md',
  '.next',             // Next.js artifacts if any
  'node_modules',      // Clean install recommended
  'package-lock.json',
  'yarn.lock'
];

console.log('🧹 Starting cleanup of backend and legacy files...');

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
    console.log('🗑️  Cleanup script removed itself.');
} catch (e) {
    console.log('You can now delete this file.');
}