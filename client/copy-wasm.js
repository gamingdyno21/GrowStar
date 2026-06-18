import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const srcDir = path.join(__dirname, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const destDir = path.join(__dirname, 'public', 'wasm');

const modelUrl = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
const modelDestDir = path.join(__dirname, 'public', 'model');
const modelDestPath = path.join(modelDestDir, 'blaze_face_short_range.task');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) {
    console.error(`Source directory ${from} does not exist.`);
    return;
  }
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

function downloadModel() {
  if (!fs.existsSync(modelDestDir)) {
    fs.mkdirSync(modelDestDir, { recursive: true });
  }
  if (fs.existsSync(modelDestPath)) {
    console.log('Model file already exists. Skipping download.');
    return Promise.resolve();
  }
  
  console.log('Downloading face detector model...');
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(modelDestPath);
    https.get(modelUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get model: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Model downloaded successfully.');
        resolve();
      });
    }).on('error', (err) => {
      if (fs.existsSync(modelDestPath)) {
        fs.unlinkSync(modelDestPath);
      }
      reject(err);
    });
  });
}

async function run() {
  try {
    console.log('Copying MediaPipe WASM files...');
    copyFolderSync(srcDir, destDir);
    console.log('MediaPipe WASM files copied successfully.');
    
    await downloadModel();
    console.log('MediaPipe assets setup complete.');
  } catch (error) {
    console.error('Error setting up MediaPipe assets:', error);
    process.exit(1);
  }
}

run();
