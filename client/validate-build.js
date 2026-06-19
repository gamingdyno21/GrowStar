import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

// Forbidden terms for any text file in dist (HTML, JS, CSS)
const forbiddenTerms = [
  'vision_bundle.js',
  '@mediapipe/tasks-vision'
];

// For compiled assets (JS/CSS under assets/), cdn.jsdelivr is strictly forbidden
const forbiddenAssetsTerms = [
  ...forbiddenTerms,
  'cdn.jsdelivr'
];

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function validate() {
  console.log('[BuildSafety] Starting safety validation on compiled assets in client/dist...');
  
  if (!fs.existsSync(distDir)) {
    console.error('[BuildSafety] Error: client/dist directory does not exist.');
    process.exit(1);
  }

  const files = getFiles(distDir);
  let failed = false;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const relativePath = path.relative(distDir, file);
    
    // Only scan text-based assets
    if (!['.html', '.js', '.css'].includes(ext)) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf8');
    
    // Choose appropriate set of rules based on the folder/file type
    const isAsset = relativePath.startsWith('assets') && (ext === '.js' || ext === '.css');
    const rules = isAsset ? forbiddenAssetsTerms : forbiddenTerms;

    for (const term of rules) {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        console.error(`[BuildSafety] ERROR: Forbidden reference "${term}" detected in client/dist/${relativePath}`);
        failed = true;
      }
    }
  }

  if (failed) {
    console.error('[BuildSafety] Build validation FAILED. External MediaPipe or CDN dependencies are present.');
    process.exit(1);
  }

  console.log('[BuildSafety] SUCCESS: All compiled assets passed build safety validation.');
}

validate();
