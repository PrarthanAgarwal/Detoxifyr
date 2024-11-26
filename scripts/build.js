import { build } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

function processManifest(content) {
  return content.replace(/\${(\w+)}/g, (_, key) => process.env[key] || '');
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    ensureDirectoryExists(dest);
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    const destDir = path.dirname(dest);
    ensureDirectoryExists(destDir);
    
    // Process manifest.json specially
    if (path.basename(src) === 'manifest.json') {
      const content = fs.readFileSync(src, 'utf8');
      const processedContent = processManifest(content);
      fs.writeFileSync(dest, processedContent);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

const buildExtension = async () => {
  try {
    // Load environment variables
    const envConfig = dotenv.config().parsed;
    
    // Read manifest template
    const manifestTemplate = fs.readFileSync('public/manifest.json', 'utf-8');
    
    // Replace environment variables
    const manifestContent = manifestTemplate
      .replace('${VITE_GOOGLE_CLIENT_ID}', process.env.VITE_GOOGLE_CLIENT_ID)
      .replace('${VITE_EXTENSION_KEY}', process.env.VITE_EXTENSION_KEY);
    
    // Write processed manifest
    fs.writeFileSync('dist/manifest.json', manifestContent);
    
    const distDir = path.join(__dirname, '../dist');
    ensureDirectoryExists(distDir);

    // Build main app
    await build();
    
    // Build background script
    await build({
      configFile: false,
      build: {
        outDir: 'dist',
        lib: {
          entry: resolve(__dirname, '../src/background/worker.ts'),
          formats: ['es'],
          fileName: () => 'background.js',
        },
        emptyOutDir: false,
      },
    });

    // Build content script
    await build({
      configFile: false,
      build: {
        outDir: 'dist',
        lib: {
          entry: resolve(__dirname, '../src/content/index.ts'),
          formats: ['es'],
          fileName: () => 'content.js',
        },
        emptyOutDir: false,
      },
    });

    // Copy public files
    const publicDir = path.join(__dirname, '../public');
    fs.readdirSync(publicDir).forEach(file => {
      const srcPath = path.join(publicDir, file);
      const destPath = path.join(distDir, file);
      copyRecursiveSync(srcPath, destPath);
    });

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
};

buildExtension(); 